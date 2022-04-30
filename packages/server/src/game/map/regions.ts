import _ from 'lodash';

import log from '@kaetram/common/util/log';

import World from '../world';
import Region from './region';
import Map from './map';
import Entity from '../entity/entity';
import Player from '../entity/character/player/player';
import { Modules, Opcodes } from '@kaetram/common/network';
import Dynamic from './areas/impl/dynamic';
import Area from './areas/area';
import { List, Spawn, Map as MapPacket } from '../../network/packets';
import { RegionData, RegionTileData } from '@kaetram/common/types/region';

/**
 * Class responsible for chunking up the map.
 * We split the map into regions (or chunks as other games
 * call them). Depending on the situation, events are broadcast
 * to a region and its surrounding region (combat events) or
 * they are only broadcast to the region itself (animation events).
 */

type RegionCallback = (region: number) => void;
type PRegionCallback = (entity: Entity, region: number) => void;

export default class Regions {
    private world: World;
    private regions: Region[] = [];

    private divisionSize: number;
    private sideLength = -1;

    private dynamicAreas: Dynamic;

    private enterCallback?: PRegionCallback;
    private joiningCallback?: PRegionCallback;

    public constructor(private map: Map) {
        this.world = map.world;

        // Division size must be evenly divisble by the map's width and height.
        this.divisionSize = Modules.Constants.MAP_DIVISION_SIZE;

        this.dynamicAreas = map.getDynamicAreas() as Dynamic;

        this.buildRegions();
        this.loadDynamicAreas();

        this.onEnter(this.handleEnter.bind(this));
        this.onJoining(this.handleJoining.bind(this));
    }

    /**
     * 16 x 16 regions.
     * 00 1 2 3 4 5 ... 15
     * 16 x x x x x ... 31
     * 32 x x x x x ... 47
     * 48 x x x x x ... 63
     * .    .
     * .     .
     * .      .
     * 240 x x x x  ... 255
     */

    private buildRegions(): void {
        /**
         * We use the tileSize of the map to split the entire map into even chunks.
         * In the event that we do not have even chunks, an error is thrown. Continuing
         * with this error present WILL cause the game to crash sooner or later.
         */

        if (this.map.width % this.divisionSize !== 0) {
            log.error(`Corrupted map regions. Unable to evenly divide into sections.`);
            log.error(
                `Map: ${this.map.width}x${this.map.height} - divisions: ${this.divisionSize}.`
            );
            return;
        }

        for (let y = 0; y < this.map.height; y += this.divisionSize)
            for (let x = 0; x < this.map.width; x += this.divisionSize)
                this.regions.push(new Region(x, y, this.divisionSize, this.divisionSize));

        // Number of regions per side.
        this.sideLength = this.map.width / this.divisionSize;
    }

    /**
     * Parses through our dynamic areas and adds them to the
     * region they are located in.
     */

    private loadDynamicAreas(): void {
        // If someone creates a new map without dynamic areas, skip.
        if (!this.dynamicAreas) return;

        // Parse through each areas in the dynamic areas group.
        this.dynamicAreas.forEachArea((area: Area) => {
            if (!area.isMappingArea()) return;

            let region = this.getRegion(area.x, area.y);

            if (region !== -1) this.regions[region].addDynamicArea(area);
            else log.error(`[ID: ${area.id}] Dynamic area could not be processed.`);
        });
    }

    /**
     * Iterates through all the regions in the world and sends the
     * joining entities to the players present in the regions. This
     * is essentially a queue, whenever an entity joins, the packet
     * gets sent then the queue is emptied.
     */

    public parse(): void {
        this.forEachRegion((region: Region, index: number) => {
            if (!region.isJoining()) return;

            this.sendJoining(index);

            region.clearJoining();
        });
    }

    /**
     * The handler for when an entity spawns and moves (generally applies to `Player` type).
     * We check to see if the movement is still within the same region, or we need to shift
     * the regions and notify surrounding regions of the changes.
     * @param entity The entity we are attempting to check regions.
     * @returns Whether the entity is in a new region.
     */

    public handle(entity: Entity): boolean {
        let isNewRegion = false,
            region = this.getRegion(entity.x, entity.y);

        if (entity.region === -1 || entity.region !== region) {
            isNewRegion = true;

            this.joining(entity, region);

            let oldRegions = this.remove(entity),
                newRegions = this.enter(entity, region);

            if (oldRegions.length > 0) entity.oldRegions = _.difference(oldRegions, newRegions);
        }

        return isNewRegion;
    }

    /**
     * This is the callback function for when an entity enters a region. We generally
     * don't care if a mob/item/npc enters since they are controlled by the server.
     * When a player enters however, we send it the region data.
     * @param entity The entity that is entering.
     * @param region The region that the entity is entering in.
     */

    private handleEnter(entity: Entity, region: number): void {
        if (!entity.isPlayer()) return;

        log.debug(`Entity: ${entity.instance} entering region: ${region}.`);

        //TODO
        //if (!(entity as Player).finishedMapHandshake) return;

        this.sendRegion(entity as Player);
    }

    /**
     * Handles the joining callback function. Nothing happens here except for logging,
     * it may be used in the future or will be deprecated.
     * @param entity The entity that is joining the region.
     * @param region The region that the entity is joining in.
     */

    private handleJoining(entity: Entity, region: number): void {
        if (!entity.isPlayer()) return;

        log.debug(`Entity: ${entity.instance} joining region: ${region}.`);
    }

    /**
     * Here we add the entity to the joining queue (in order to signal to the other
     * players that the entity is coming into the region). We also create a callback
     * for good measure.
     * @param entity The entity that we are adding to our joining queue.
     * @param region The region of which the joining queue occurs in.
     */

    private joining(entity: Entity, region: number): void {
        if (!entity) return;
        if (region === -1) return;

        this.regions[region].addJoining(entity);

        this.joiningCallback?.(entity, region);
    }

    /**
     * When an entity enters a region, we notify all the surrounding regions
     * that the entity has entered. We store player type entities in a separate
     * list for easier access.
     * @param entity The entity that is entering into the region.
     * @param region The region that we are adding the entity into.
     * @returns The new surrounding regions of the region the entity is entering into.
     */

    private enter(entity: Entity, region: number): number[] {
        let newRegions: number[] = [];

        if (!entity) return newRegions;

        this.forEachSurroundingRegion(region, (surroundingRegion: number) => {
            let region = this.regions[surroundingRegion];

            region.addEntity(entity);

            newRegions.push(surroundingRegion);
        });

        entity.setRegion(region);

        if (entity.isPlayer()) this.regions[region].addPlayer(entity as Player);

        this.enterCallback?.(entity, region);

        return newRegions;
    }

    /**
     * Parses through all the regions surrounding the entity and removes it
     * from them. It returns a list of old regions where the entity was. We
     * use this list to send a packet indicating the entity has been removed.
     * @param entity The entity that we are removing.
     * @returns A list of old regions where the entity was present in.
     */

    public remove(entity: Entity): number[] {
        let oldRegions: number[] = [];

        if (!entity || entity.region === -1) return oldRegions;

        let region = this.regions[entity.region];

        if (entity.isPlayer()) region.removePlayer(entity as Player);

        oldRegions = this.sendDespawns(entity);

        entity.setRegion(-1);

        return oldRegions;
    }

    /**
     * We grab all the entities in the region and send them to the client.
     * @param player The player to send entity data to.
     */

    public sendEntities(player: Player): void {
        if (player.region === -1) return;

        let entities: string[] = this.regions[player.region].getEntities(player as Entity);

        player.send(new List(entities));
    }

    /**
     * Sends a spawn message to all the entities in the region
     * when an entity is entering the region.
     * @param region The region which we grab the players of and send the messsage to.
     */

    public sendJoining(region: number): void {
        this.regions[region].forEachJoining((entity: Entity) => {
            this.world.push(Modules.PacketType.Regions, {
                region,
                ignore: entity.isPlayer() ? entity.instance : '',
                packet: new Spawn(entity)
            });
        });
    }

    /**
     * Takes the entity and signals to the surrounding regions that
     * it should be despawned.
     * @param entity The entity that we are despawning.
     */

    private sendDespawns(entity: Entity): number[] {
        let oldRegions: number[] = [];

        this.forEachSurroundingRegion(entity.region, (surroundingRegion: number) => {
            let region = this.regions[surroundingRegion];

            if (!region.hasEntity(entity)) return;

            region.removeEntity(entity);

            oldRegions.push(surroundingRegion);
        });

        return oldRegions;
    }

    /**
     * Takes a player as a parameter and uses its position to determine the
     * region data to send to the client.
     * @param player The player character that we are sending the region to.
     */

    public sendRegion(player: Player): void {
        player.send(new MapPacket(Opcodes.Map.Render, this.getRegionData(player)));
    }

    /**
     * Grabs a region from our list based on the region parameter.
     * @param region The region id that we are attempting to grab.
     * @returns Returns the region object with the respective id.
     */

    public get(region: number): Region {
        return this.regions[region];
    }

    /**
     * Iterates through the regions and determines which region index (in the array)
     * belongs to the gridX and gridY specified.
     * @param x The player's x position in the grid (floor(x / tileSize))
     * @param y The player's y position in the grid (floor(y / tileSize))
     * @returns The region id the coordinates are in.
     */

    public getRegion(x: number, y: number): number {
        let region = _.findIndex(this.regions, (region: Region) => {
            return region.inRegion(x, y);
        });

        return region;
    }

    /**
     * Iterates through the region and its surrounding neighbours. We extract
     * the tile data of each region. The doors in the region are also sent alongside.
     * Format:
     * RegionData: {
     *      regionId: {
     *          tileData: (number | number)[]
     *      }
     * }
     * @param player The player we are grabbing information for.
     * @returns Region data containing regions, doors, and tile information.
     */

    public getRegionData(player: Player, force?: boolean): RegionData {
        let data: RegionData = {},
            region = this.getRegion(player.x, player.y);

        this.forEachSurroundingRegion(region, (surroundingRegion: number) => {
            if (player.hasLoadedRegion(surroundingRegion) && !force) return;

            let region = this.regions[surroundingRegion];

            // Initialize empty array with tile data for the region.
            data[surroundingRegion] = [];

            region.forEachTile((x: number, y: number) => {
                let dynamicArea = region.getDynamicArea(x, y),
                    tileInfo =
                        region.hasDynamicAreas() && dynamicArea
                            ? this.buildDynamicTile(player, dynamicArea, x, y)
                            : this.buildTile(x, y);

                data[surroundingRegion].push(tileInfo);
            });

            player.loadRegion(surroundingRegion);
        });

        return data;
    }

    /**
     * Takes the tile's position and builds a TileInfo object.
     * This is where all the fancy stuff with dynamic objects
     * will be happening.
     * @param x The x position of the tile in the grid space.
     * @param y The y position of the tile in the grid space.
     * @returns Returns a `TileInfo` object based on the coordinates.
     */

    private buildTile(x: number, y: number, index?: number): RegionTileData {
        // Use the specified index if not undefined or calculate it.
        index ||= this.map.coordToIndex(x, y);

        let tile: RegionTileData = {
            x,
            y,
            data: this.map.getTileData(index)
        };

        /**
         * A tile is colliding if it exists in our array of collisions (See
         * `parseTileLayerData()` in `processmap.ts`). If there is no tile data
         * (i.e. the tile is blank) it is automatically colliding.
         */
        if (this.map.isCollisionIndex(index)) tile.c = true;

        return tile;
    }

    /**
     * Takes the area and the player as extra parameters to determine if the player fulfills
     * the requirements for the area. If he does (say for example he finished the necessary quest)
     * then we use the mapped dynamic tile to render to him instead.
     * @param player The player character to extract achievement/quest/etc status.
     * @param area The area containing the dynamic tiles - used for mapping.
     * @param x The original tile x grid coordinate.
     * @param y The original tile y grid coordinate.
     * @returns The mapped tileInfo.
     */

    private buildDynamicTile(player: Player, area: Area, x: number, y: number): RegionTileData {
        let original = this.buildTile(x, y);

        // Does not proceed any further if the player does not fulfill the requirements
        if (!area.fulfillsRequirement(player)) return original;

        let mappedTile = area.getMappedTile(x, y);

        // Defaults to building the original tile if mapping cannot be achieved.
        if (!mappedTile) return original;

        // Gets the index of the mapped tile coordinates.
        let index = this.map.coordToIndex(mappedTile.x, mappedTile.y);

        // We build a tile using our mapped tile's index, hence why we specify the index as a parameter
        return this.buildTile(x, y, index);
    }

    /**
     * Calls back each region surrounding the parameter `region` (inclusive).
     * @param region The region we are looking around.
     * @param callback A region that surrounds `region`
     */

    public forEachSurroundingRegion(region: number, callback: RegionCallback): void {
        _.each(this.getSurroundingRegions(region), callback);
    }

    /**
     * Callback for each region in the system.
     * @param callback Returns a region and index.
     */

    public forEachRegion(callback: (region: Region, index: number) => void): void {
        _.each(this.regions, callback);
    }

    /**
     * Returns a list of surrounding regions (including the specified region).
     * @param region The region we want surrounding regions of.
     */

    private getSurroundingRegions(region: number): number[] {
        let surroundingRegions = [region],
            { sideLength } = this;

        // Handle regions near edge of the map and horizontally.
        // left edge piece
        if (this.isLeftEdge(region)) surroundingRegions.push(region + 1);
        // right edge piece.
        else if (this.isRightEdge(region)) surroundingRegions.push(region - 1);
        else surroundingRegions.push(region - 1, region + 1);

        // Handle vertical edge cases
        if (this.isTopEdge(region) || this.isBottomEdge(region)) {
            let relativeRegion;

            relativeRegion = this.isTopEdge(region) ? region + sideLength : region - sideLength;

            surroundingRegions.push(relativeRegion);

            if (this.isLeftEdge(relativeRegion)) surroundingRegions.push(relativeRegion + 1);
            else if (this.isRightEdge(relativeRegion)) surroundingRegions.push(relativeRegion - 1);
            else surroundingRegions.push(relativeRegion - 1, relativeRegion + 1);
            // eslint-disable-next-line curly
        } else {
            if (this.isLeftEdge(region))
                surroundingRegions.push(
                    region - sideLength,
                    region - sideLength + 1,
                    region + sideLength,
                    region + sideLength + 1
                );
            else if (this.isRightEdge(region))
                surroundingRegions.push(
                    region - sideLength,
                    region - sideLength - 1,
                    region + sideLength,
                    region + sideLength - 1
                );
            else
                surroundingRegions.push(
                    region + sideLength,
                    region - sideLength,
                    region + sideLength - 1,
                    region + sideLength + 1,
                    region - sideLength - 1,
                    region - sideLength + 1
                );
        }

        return surroundingRegions;
    }

    // Checks if the region is on the left border of the map.
    private isLeftEdge(region: number): boolean {
        return region % this.sideLength === 0;
    }

    // Checks if region is on right border of the map.
    private isRightEdge(region: number): boolean {
        return region % this.sideLength === this.sideLength - 1;
    }

    // Checks if the region is on the top of the map.
    private isTopEdge(region: number): boolean {
        return region < this.sideLength;
    }

    // Checks if the region is on the bottom of the map.
    private isBottomEdge(region: number): boolean {
        return region > this.regions.length - this.sideLength - 1;
    }

    /**
     * Callback for when a player enters a region.
     */

    private onEnter(callback: PRegionCallback): void {
        this.enterCallback = callback;
    }

    /**
     * Callback for when an entity is joining the region.
     */

    private onJoining(callback: PRegionCallback): void {
        this.joiningCallback = callback;
    }
}
