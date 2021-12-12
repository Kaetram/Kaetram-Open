import _ from 'lodash';

import log from '@kaetram/common/util/log';

import Area from './areas/area';
import World from '../world';
import Region from './region';
import Map, { AnimatedTile, ParsedTile } from './map';
import Entity from '../entity/entity';
import Player from '../entity/character/player/player';
import Messages from '../../network/messages';
import { Opcodes } from '@kaetram/common/network';

/**
 * Class responsible for chunking up the map.
 * We split the map into regions (or chunks as other games
 * call them). Depending on the situation, events are broadcast
 * to a region and its surrounding region (combat events) or
 * they are only broadcast to the region itself (animation events).
 */

type TileInfo = { x: number; y: number; data: ParsedTile; animation?: AnimatedTile; c?: boolean };
type RegionInfo = { data: TileInfo[] };
type RegionData = { [region: number]: RegionInfo };
type RegionCallback = (region: number) => void;
type PRegionCallback = (entity: Entity, region: number) => void;

export default class Regions {
    private world: World;
    private regions: Region[] = [];

    private divisions: number;
    private sideLength = -1;

    private enterCallback?: PRegionCallback;
    private joiningCallback?: PRegionCallback;

    public constructor(private map: Map) {
        this.world = map.world;

        this.divisions = map.tileSize;

        this.buildRegions();

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
         */

        if (this.map.width % this.divisions !== 0) {
            log.error(`Corrupted map regions. Unable to evenly divide into sections.`);
            log.error(`Map: ${this.map.width}x${this.map.height} - divisions: ${this.divisions}.`);
            return;
        }

        for (let y = 0; y < this.map.height; y += this.divisions)
            for (let x = 0; x < this.map.width; x += this.divisions)
                this.regions.push(new Region(x, y, this.divisions, this.divisions));

        // Number of regions per side.
        this.sideLength = this.map.width / this.divisions;
    }

    /**
     * Iterates through all the regiosn and parses them (to be expanded)
     */

    public parse(): void {
        this.forEachRegion((region: Region, index: number) => {
            if (!region.isJoining()) return;

            this.sendJoining(index);

            region.clearJoining();
        });
    }

    /**
     * The handler function for when an entity (usually a player)
     * makes a movement in the grid system. We determine if they are
     * still in the current region or not.
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

    private handleEnter(entity: Entity, region: number) {
        if (!entity.isPlayer()) return;

        log.debug(`Entity: ${entity.instance} entering region: ${region}.`);

        //TODO
        //if (!(entity as Player).finishedMapHandshake) return;

        this.sendRegion(entity as Player);
    }

    private handleJoining(entity: Entity, region: number): void {
        if (!entity.isPlayer()) return;

        log.debug(`Entity: ${entity.instance} joining region: ${region}.`);
    }

    /**
     * Indicates that an entity is joining the region.
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

        player.send(new Messages.List(entities));
    }

    public sendJoining(region: number): void {
        this.regions[region].forEachJoining((entity: Entity) => {
            this.world.push(Opcodes.Push.Regions, {
                region,
                message: new Messages.Spawn(entity),
                ignoreId: entity.isPlayer() ? entity.instance : null
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
        player.send(new Messages.Region(Opcodes.Region.Render, this.getRegionData(player)));
    }

    /**
     * Public method for grabbing a region based on its id.
     */

    public get(region: number): Region {
        return this.regions[region];
    }

    /**
     * Iterates through the regions and determines which region in the array
     * of regions the x and y coordinates are in.
     * @param x An x coordinate within the map boundaries.
     * @param y A y coordinate within the map boundaries.
     * @returns The region id that the entity is currently in.
     */

    /**
     * Iterates through the regions and determines which region index (in the array)
     * belongs to the gridX and gridY specified.
     * @param gridX The player's x position in the grid (floor(x / tileSize))
     * @param gridY The player's y position in the grid (floor(y / tileSize))
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
     * @param player The player we are grabbing information from.
     * @returns Region data containing regions, doors, and tile information.
     */

    public getRegionData(player: Player): RegionData {
        let data: RegionData = {},
            region = this.getRegion(player.x, player.y);

        this.forEachSurroundingRegion(region, (surroundingRegion: number) => {
            if (player.hasLoadedRegion(surroundingRegion)) return;

            let region = this.regions[surroundingRegion];

            // Initialize empty array with tile data for the region.
            data[surroundingRegion] = {
                data: []
            };

            region.forEachTile((x: number, y: number) => {
                let index = this.map.coordToIndex(x, y),
                    tileData = this.map.getTileData(index),
                    isCollision = this.map.collisions.includes(index) || !tileData,
                    tile: TileInfo = {
                        x,
                        y,
                        data: tileData
                        //animation: this.map.getAnimation(index)
                    };

                if (isCollision) tile.c = isCollision;

                data[surroundingRegion].data.push(tile);
            });

            player.loadRegion(surroundingRegion);
        });

        return data;
    }

    /**
     * Calls back each region surrounding the parameter `region` (inclusive).
     * @param region The region we are looking around.
     * @param callback A region that surrounds `region`
     */

    public forEachSurroundingRegion(region: number, callback: RegionCallback): void {
        _.each(this.getSurroundingRegions(region), callback);
    }

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

    private onJoining(callback: PRegionCallback): void {
        this.joiningCallback = callback;
    }
}
