/* global module */

import _ from 'lodash';
import fs from 'fs';
import path from 'path';

import Messages from '../network/messages';
import Packets from '../network/packets';
import Player from '../game/entity/character/player/player';
import Entity from '../game/entity/entity';
import Map from '../map/map';
import Regions from '../map/regions';
import World from '../game/world';
import config from '../../config';
import log from '../util/log';
import Utils from '../util/utils';
import Entities from '../controllers/entities';

const map = path.resolve(__dirname, '../../data/map/world.json');

class Region {
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

    regions: any;

    loaded: boolean;

    addCallback: Function;
    removeCallback: Function;
    incomingCallback: Function;

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

        this.onRemove((entity: Entity, oldRegions: any) => {
            if (!oldRegions || oldRegions.length < 1 || !entity || !entity.username) return;
        });

        this.onIncoming((entity: Entity, regionId: string) => {
            if (!entity || !entity.username) return;

            if (config.debug)
                log.info('Entity - ' + entity.username + ' is incoming into region - ' + regionId);
        });

        this.load();
        this.loadWatcher();
    }

    load() {

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

    loadWatcher() {
        fs.watch(map, (_eventType, _fileName) => {
            this.update();
        });

        log.info('Finished loading file watcher!');
    }

    update() {
        let data = fs.readFileSync(map, {
            encoding: 'utf8',
            flag: 'r'
        });

        if (!data) return;

        try {
            let checksum = Utils.getChecksum(data);

            if (checksum === this.map.checksum) return;

            this.map.load();

            log.debug('Successfully loaded new map data.');

            this.updateRegions();
        } catch (e) {
            log.error('Could not parse new map file.');
            log.debug(e);
        }
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
            player: player,
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
            if (this.regions[regionId].incoming.length < 1) return;

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

        //No need to send empty data...
        if (tileData.length > 0)
            player.send(new Messages.Region(Packets.RegionOpcode.Render, tileData, force));
    }

    // TODO - Format dynamic tiles to follow same structure as `getRegionData()`
    getDynamicTiles(player: Player) {
        let dynamicTiles = {},
            doors: any = player.doors.getAllTiles(),
            trees: any = player.getSurroundingTrees();

        doors.indexes.push.apply(doors.indexes, trees.indexes);
        doors.data.push.apply(doors.data, trees.data);
        doors.collisions.push.apply(doors.collisions, trees.collisions);
        
        if (trees.objectData) doors.objectData = trees.objectData;

        for (let i in doors.indexes) {
            let tile: any = {
                data: doors.data[i],
                isCollision: doors.collisions[i]
            }, index = doors.indexes[i];

            if (!doors.objectData) break;

            if (index in doors.objectData) {
                tile.isObject = doors.objectData[index].isObject;

                if (doors.objectData[index].cursor)
                    tile.cursor = doors.objectData[index].cursor;
            }

            dynamicTiles[index] = tile;
        }

        return dynamicTiles;
    }

    sendTilesetInfo(player: Player) {
        let tileCollisions = this.map.tileCollisions,
            tilesetData = {};

        for (let i in this.map.tileCollisions)
            tilesetData[tileCollisions[i]] = { c: true };

        for (let i in this.map.high)
            if (i in tilesetData) tilesetData[i].h = this.map.high[i];
            else tilesetData[i] = { h: this.map.high[i] };

        player.send(new Messages.Region(Packets.RegionOpcode.Tileset, tilesetData));
    }

    sendSpawns(regionId: string) {
        if (!regionId) return;

        _.each(this.regions[regionId].incoming, (entity: Entity) => {
            if (!entity || !entity.instance || entity.instanced) return;

            this.world.push(Packets.PushOpcode.Regions, {
                regionId: regionId,
                message: new Messages.Spawn(entity),
                ignoreId: entity.isPlayer() ? entity.instance : null
            });
        });
    }

    add(entity: Entity, regionId: string) {
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

    remove(entity: Entity) {
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

    incoming(entity: Entity, regionId: string) {
        if (!entity || !regionId) return;

        const region = this.regions[regionId];

        if (region && !_.includes(region.entities, entity.instance)) region.incoming.push(entity);

        if (this.incomingCallback) this.incomingCallback(entity, regionId);
    }

    handle(entity: Entity, region?: string) {
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

    push(player: Player) {
        let entities: any;

        if (!player || !(player.region in this.regions)) return;

        entities = _.keys(this.regions[player.region].entities);

        entities = _.reject(entities, (instance) => {
            return instance === player.instance; //TODO //|| player.isInvisible(instance);
        });

        entities = _.map(entities, (instance: string) => {
            return instance;
        });

        player.send(new Messages.List(entities));
    }

    changeTileAt(player: Player, newTile: any, x: number, y: number) {
        const index = this.gridPositionToIndex(x, y);

        player.send(Region.getModify(index, newTile));
    }

    changeGlobalTile(newTile: any, x: number, y: number) {
        const index = this.gridPositionToIndex(x, y);

        this.map.data[index] = newTile;

        this.world.push(Packets.PushOpcode.Broadcast, {
            message: Region.getModify(index, newTile)
        });
    }

    getRegionData(region: string, player: Player, force?: boolean) {
        let data = [];

        if (!player) return data;

        let dynamicTiles = this.getDynamicTiles(player);

        this.mapRegions.forEachSurroundingRegion(region, (regionId: string) => {
            if (player.hasLoadedRegion(regionId) && !force) return;

            const bounds = this.getRegionBounds(regionId);

            this.forEachTile(bounds, player.webSocketClient, (tile: any) => {
                if (tile.index in dynamicTiles) {
                    let dynamicTile = dynamicTiles[tile.index]

                    tile.data = dynamicTile.data;
                    tile.isCollision = dynamicTile.isCollision;

                    if (dynamicTile.isObject) tile.isObject = dynamicTile.isObject
                    if (dynamicTile.cursor) tile.cursor = dynamicTile.cursor;
                }

                if (player.webSocketClient) delete tile.index;

                data.push(tile);
            });
        });

        return data;
    }

    forEachTile(bounds: any, webSocket: boolean, callback: (tile: any) => void) {
        this.forEachGrid(bounds, (x: number, y: number) => {
            let index = this.gridPositionToIndex(x - 1, y),
                tileData = this.map.data[index],
                isCollision =
                    this.map.collisions.indexOf(index) > -1 || !tileData,
                objectId: any;

            if (tileData !== 0) {
                if (tileData instanceof Array) {
                    for (let j = 0; j < tileData.length; j++) {
                        if (this.map.isObject(tileData[j])) {
                            objectId = tileData[j];
                            break;
                        }
                    }
                } else if (this.map.isObject(tileData)) objectId = tileData;
            }

            let info: any = {
                index: index
            };

            if (webSocket)
                info.position = { x: x, y: y };

            if (tileData) info.data = tileData;

            if (isCollision) info.isCollision = isCollision;

            if (objectId) {
                info.isObject = !!objectId;

                const cursor = this.map.getCursor(info.index, objectId);

                if (cursor) info.cursor = cursor;
            }

            callback(info);
        });
    }

    forEachGrid(bounds: any, callback: (x: number, y: number) => void) {
        for (let y = bounds.startY; y < bounds.endY; y++)
            for (let x = bounds.startX; x < bounds.endX; x++)
                callback(x, y);
    }

    getRegionBounds(regionId: string) {
        const regionCoordinates = this.mapRegions.regionIdToCoordinates(regionId);

        return {
            startX: regionCoordinates.x,
            startY: regionCoordinates.y,
            endX: regionCoordinates.x + this.map.regionWidth,
            endY: regionCoordinates.y + this.map.regionHeight
        };
    }

    static getModify(index: number, newTile: any) {
        return new Messages.Region(Packets.RegionOpcode.Modify, {
            index: index,
            newTile: newTile
        });
    }

    static instanceToRegionId(instancedRegionId: string) {
        const region = instancedRegionId.split('-');

        return region[0] + '-' + region[1];
    }

    static regionIdToInstance(entity: Entity, regionId: string) {
        return regionId + '-' + entity.instance;
    }

    gridPositionToIndex(x: number, y: number) {
        return y * this.map.width + x + 1;
    }

    onAdd(callback: Function) {
        this.addCallback = callback;
    }

    onRemove(callback: Function) {
        this.removeCallback = callback;
    }

    onIncoming(callback: Function) {
        this.incomingCallback = callback;
    }
}

export default Region;
