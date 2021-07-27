import _ from 'lodash';

import Packets from '@kaetram/common/src/packets';

import config from '../../config';
import Entities from '../controllers/entities';
import Player from '../game/entity/character/player/player';
import Entity from '../game/entity/entity';
import World from '../game/world';
import Map from '../map/map';
import Regions from '../map/regions';
import Messages, { Packet } from '../network/messages';
import log from '../util/log';

type Bounds = {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
};

type Tile = number | number[];

interface RegionData {
    entities: { [instance: string]: Entity };
    players: string[];
    incoming: Entity[];
}

interface RegionTileData {
    index: number;
    position: Pos;
    data: number;
    isCollision: boolean;
    isObject: boolean;
    cursor: string;
}

export default class Region {
    /**
     * Region Generation.
     * This is used in order to send the client data about the new region
     * it is about to enter. This has to be greatly expanded to generated
     * instanced areas where other entities will not be pushed to surrounding
     * players, even if they share the same coordinates.
     */

    map: Map;
    mapRegions: Regions;

    world: World;
    entities: Entities;

    regions: { [id: string]: RegionData };

    loaded: boolean;

    addCallback: (entity: Entity, regionId: string) => void;
    removeCallback: (entity: Entity, oldRegions: string[]) => void;
    incomingCallback: (entity: Entity, regionId: string) => void;

    constructor(world: World) {
        this.map = world.map;
        this.mapRegions = world.map.regions;

        this.world = world;
        this.entities = world.entities;

        this.regions = {};
        this.loaded = false;

        this.onAdd((entity: Entity, regionId: string) => {
            if (!entity || !entity.username) return;

            if (config.debug)
                log.info('Entity - ' + entity.username + ' has entered region - ' + regionId);

            if (entity instanceof Player) {
                if (!entity.questsLoaded) return;

                if (!entity.achievementsLoaded) return;

                this.sendRegion(entity, regionId);
            }
        });

        this.onRemove((entity: Entity, oldRegions: string[]) => {
            if (!oldRegions || oldRegions.length === 0 || !entity || !entity.username) return;
        });

        this.onIncoming((entity: Entity, regionId: string) => {
            if (!entity || !entity.username) return;

            if (config.debug)
                log.info('Entity - ' + entity.username + ' is incoming into region - ' + regionId);
        });

        this.load();
    }

    load(): void {
        this.mapRegions.forEachRegion((regionId: string) => {
            this.regions[regionId] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        this.loaded = true;

        log.info('Finished loading regions!');
    }

    addEntityToInstance(entity: Entity, player: Player): void {
        if (!entity) return;

        this.add(entity, player.region);

        player.updateRegion();
    }

    createInstance(player: Player, regionId: string): void {
        /**
         * We create an instance at the player's current surrounding
         * region IDs. These will have to be disposed of whenever we're done.
         */

        player.instanced = true;

        this.mapRegions.forEachSurroundingRegion(regionId, (region: string) => {
            this.regions[Region.regionIdToInstance(player, region)] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        this.handle(player, regionId);
        this.push(player);

        this.world.push(Packets.PushOpcode.OldRegions, {
            player,
            message: new Messages.Region(Packets.RegionOpcode.Update, {
                id: player.instance,
                type: 'remove'
            })
        });
    }

    deleteInstance(player: Player): void {
        player.instanced = false;

        this.handle(player);
        this.push(player);

        this.mapRegions.forEachSurroundingRegion(player.region, (regionId: string) => {
            const instancedRegion = Region.regionIdToInstance(player, regionId);

            if (instancedRegion in this.regions) delete this.regions[instancedRegion];
        });
    }

    parseRegions(): void {
        if (!this.loaded) return;

        this.mapRegions.forEachRegion((regionId: string) => {
            if (this.regions[regionId].incoming.length === 0) return;

            this.sendSpawns(regionId);

            this.regions[regionId].incoming = [];
        });
    }

    syncRegions(player: Player): void {
        this.handle(player);
        this.push(player);

        this.sendTilesetInfo(player);
    }

    // If `regionId` is not null, we update adjacent regions
    updateRegions(regionId?: string): void {
        if (regionId)
            this.mapRegions.forEachSurroundingRegion(regionId, (id: string) => {
                const region = this.regions[id];

                _.each(region.players, (instance: string) => {
                    const player = this.entities.players[instance];

                    if (player) this.sendRegion(player, player.region);
                });
            });
        else
            this.entities.forEachPlayer((player: Player) => {
                player.regionsLoaded = [];

                this.sendRegion(player, player.region, true);
                this.sendTilesetInfo(player);
            });
    }

    sendRegion(player: Player, region: string, force?: boolean): void {
        let tileData = this.getRegionData(region, player, force);

        // No need to send empty data...
        if (tileData.length > 0)
            player.send(new Messages.Region(Packets.RegionOpcode.Render, tileData));
    }

    // TODO - Format dynamic tiles to follow same structure as `getRegionData()`
    getDynamicTiles(player: Player): { [index: number]: RegionTileData } {
        let dynamicTiles = {},
            doors = player.doors.getAllTiles(),
            trees = player.getSurroundingTrees();

        doors.indexes.push(...trees.indexes);
        doors.data.push(...trees.data);
        doors.collisions.push(...trees.collisions);
        if (trees.objectData) doors.objectData = trees.objectData;

        for (let i in doors.indexes) {
            let tile: Partial<RegionTileData> = {
                    data: doors.data[i],
                    isCollision: doors.collisions[i]
                },
                index = doors.indexes[i];

            if (!doors.objectData) break;

            if (index in doors.objectData) {
                tile.isObject = doors.objectData[index].isObject;

                if (doors.objectData[index].cursor) tile.cursor = doors.objectData[index].cursor;
            }

            dynamicTiles[index] = tile;
        }

        return dynamicTiles;
    }

    sendTilesetInfo(player: Player): void {
        let tilesetData = {};

        for (let i in this.map.tileCollisions)
            tilesetData[this.map.tileCollisions[i]] = { c: true };

        for (let i in this.map.high)
            if (i in tilesetData) tilesetData[i].h = this.map.high[i];
            else tilesetData[i] = { h: this.map.high[i] };

        player.send(new Messages.Region(Packets.RegionOpcode.Tileset, tilesetData));
    }

    sendSpawns(regionId: string): void {
        if (!regionId) return;

        _.each(this.regions[regionId].incoming, (entity: Entity) => {
            if (!entity || !entity.instance || entity.instanced) return;

            this.world.push(Packets.PushOpcode.Regions, {
                regionId,
                message: new Messages.Spawn(entity),
                ignoreId: entity.isPlayer() ? entity.instance : null
            });
        });
    }

    add(entity: Entity, regionId: string): string[] {
        const newRegions = [];

        if (entity && regionId && regionId in this.regions) {
            this.mapRegions.forEachSurroundingRegion(regionId, (id: string) => {
                if (entity.instanced) id = Region.regionIdToInstance(entity, id);

                const region = this.regions[id];

                if (region && region.entities) {
                    region.entities[entity.instance] = entity;
                    newRegions.push(id);
                }
            });

            entity.region = regionId;

            if (entity instanceof Player) this.regions[regionId].players.push(entity.instance);
        }

        if (this.addCallback) this.addCallback(entity, regionId);

        return newRegions;
    }

    remove(entity: Entity): string[] {
        const oldRegions = [];

        if (entity && entity.region) {
            const region = this.regions[entity.region];

            if (entity instanceof Player)
                region.players = _.reject(region.players, (id) => {
                    return id === entity.instance;
                });

            this.mapRegions.forEachSurroundingRegion(entity.region, (id: string) => {
                if (this.regions[id] && entity.instance in this.regions[id].entities) {
                    delete this.regions[id].entities[entity.instance];
                    oldRegions.push(id);
                }
            });

            entity.region = null;
        }

        if (this.removeCallback) this.removeCallback(entity, oldRegions);

        return oldRegions;
    }

    incoming(entity: Entity, regionId: string): void {
        if (!entity || !regionId) return;

        const region = this.regions[regionId];

        if (region && !(entity.instance in region.entities)) region.incoming.push(entity);

        if (this.incomingCallback) this.incomingCallback(entity, regionId);
    }

    handle(entity: Entity, region?: string): boolean {
        let regionsChanged = false;

        if (!entity) return regionsChanged;

        let regionId = region ? region : this.mapRegions.regionIdFromPosition(entity.x, entity.y);

        if (entity.instanced) regionId = Region.regionIdToInstance(entity, regionId);

        if (!entity.region || (entity.region && entity.region !== regionId)) {
            regionsChanged = true;

            this.incoming(entity, regionId);

            const oldRegions = this.remove(entity),
                newRegions = this.add(entity, regionId);

            if (_.size(oldRegions) > 0) entity.recentRegions = _.difference(oldRegions, newRegions);
        }

        return regionsChanged;
    }

    push(player: Player): void {
        let entities: string[];

        if (!player || !(player.region in this.regions)) return;

        entities = _.keys(this.regions[player.region].entities);

        entities = _.reject(entities, (instance) => {
            return instance === player.instance; // TODO //|| player.isInvisible(instance);
        });

        entities = _.map(entities, (instance: string) => {
            return instance;
        });

        player.send(new Messages.List(entities));
    }

    changeTileAt(player: Player, newTile: Tile, x: number, y: number): void {
        const index = this.gridPositionToIndex(x, y);

        player.send(Region.getModify(index, newTile));
    }

    changeGlobalTile(newTile: Tile, x: number, y: number): void {
        const index = this.gridPositionToIndex(x, y);

        this.map.data[index] = newTile;

        this.world.push(Packets.PushOpcode.Broadcast, {
            message: Region.getModify(index, newTile)
        });
    }

    getRegionData(region: string, player: Player, force?: boolean): RegionTileData[] {
        let data = [];

        if (!player) return data;

        let dynamicTiles = this.getDynamicTiles(player);

        this.mapRegions.forEachSurroundingRegion(region, (regionId: string) => {
            if (player.hasLoadedRegion(regionId) && !force) return;

            player.loadRegion(regionId);

            const bounds = this.getRegionBounds(regionId);

            this.forEachTile(bounds, player.webSocketClient, dynamicTiles, (tile) => {
                data.push(tile);
            });
        });

        return data;
    }

    forEachTile(
        bounds: Bounds,
        webSocket: boolean,
        dynamicTiles: {
            [index: number]: RegionTileData;
        },
        callback: (tile: RegionTileData) => void
    ): void {
        this.forEachGrid(bounds, (x: number, y: number) => {
            let index = this.gridPositionToIndex(x - 1, y),
                tileData = this.map.data[index],
                isCollision = this.map.collisions.includes(index) || !tileData,
                objectId: number;

            if (tileData !== 0)
                if (Array.isArray(tileData)) {
                    for (let tile of tileData)
                        if (this.map.isObject(tile)) {
                            objectId = tile;
                            break;
                        }
                } else if (this.map.isObject(tileData)) objectId = tileData;

            let info: Partial<RegionTileData> = {
                index
            };

            if (info.index in dynamicTiles) {
                let dynamicTile = dynamicTiles[info.index];

                info.data = dynamicTile.data;
                info.isCollision = dynamicTile.isCollision;

                if (dynamicTile.isObject) info.isObject = dynamicTile.isObject;
                if (dynamicTile.cursor) info.cursor = dynamicTile.cursor;
            } else {
                if (tileData) info.data = tileData as number;
                if (isCollision) info.isCollision = isCollision;
                if (objectId) {
                    info.isObject = !!objectId;
                    const cursor = this.map.getCursor(info.index, objectId);
                    if (cursor) info.cursor = cursor;
                }
            }

            if (webSocket) {
                delete info.index;

                info.position = { x, y };
            }

            callback(info as RegionTileData);
        });
    }

    forEachGrid(bounds: Bounds, callback: (x: number, y: number) => void): void {
        for (let y = bounds.startY; y < bounds.endY; y++)
            for (let x = bounds.startX; x < bounds.endX; x++) callback(x, y);
    }

    getRegionBounds(regionId: string): Bounds {
        const regionCoordinates = this.mapRegions.regionIdToCoordinates(regionId);

        return {
            startX: regionCoordinates.x,
            startY: regionCoordinates.y,
            endX: regionCoordinates.x + this.map.regionWidth,
            endY: regionCoordinates.y + this.map.regionHeight
        };
    }

    static getModify(index: number, newTile: Tile): Packet {
        return new Messages.Region(Packets.RegionOpcode.Modify, {
            index,
            newTile
        });
    }

    static instanceToRegionId(instancedRegionId: string): string {
        const region = instancedRegionId.split('-');

        return region[0] + '-' + region[1];
    }

    static regionIdToInstance(entity: Entity, regionId: string): string {
        return regionId + '-' + entity.instance;
    }

    gridPositionToIndex(x: number, y: number): number {
        return y * this.map.width + x + 1;
    }

    onAdd(callback: (entity: Entity, regionId: string) => void): void {
        this.addCallback = callback;
    }

    onRemove(callback: (entity: Entity, oldRegions: string[]) => void): void {
        this.removeCallback = callback;
    }

    onIncoming(callback: (entity: Entity, regionId: string) => void): void {
        this.incomingCallback = callback;
    }
}
