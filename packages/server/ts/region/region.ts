/* global module */

import _ from 'underscore';
import Messages from '../network/messages';
import Packets from '../network/packets';
import Player from '../game/entity/character/player/player';
import Map from '../map/map';
import Regions from '../map/regions';
import World from '../game/world';
import * as fs from 'fs';
import log from "../util/log";
import * as path from 'path';
import config from "../../config";

const map = path.resolve(__dirname, '../../data/map/world_client.json');

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

    clientMap: any;

    world: World;

    regions: any;

    loaded: boolean;

    constructor(world) {
        this.map = world.map;
        this.mapRegions = world.map.regions;

        this.clientMap = this.map.clientMap;

        this.world = world;

        this.regions = {};
        this.loaded = false;

        this.onAdd((entity, regionId) => {
            if (!entity || !entity.username)
                return;

            if (config.debug)
                log.info('Entity - ' + entity.username + ' has entered region - ' + regionId);

            if (entity instanceof Player) {
                if (!entity.questsLoaded)
                    return;

                if (!entity.achievementsLoaded)
                    return;

                this.sendRegion(entity, regionId);
            }
        });

        this.onRemove((entity, oldRegions) => {
            if (!oldRegions || oldRegions.length < 1 || !entity || !entity.username)
                return;
        });

        this.onIncoming((entity, regionId) => {
            if (!entity || !entity.username)
                return;

            if (config.debug)
                log.info('Entity - ' + entity.username + ' is incoming into region - ' + regionId);

        });

        fs.watchFile(map, () => {
            log.info('Received Map Update -> Sending to Players...');

            fs.readFile(map, 'utf8', (error, data) => {
                if (error) {
                    log.error('Could not reload the map file...');
                    return;
                }

                try {

                    this.clientMap = JSON.parse(data);

                    this.updateRegions();

                } catch(e) {
                    log.error('Could not parse JSON.');
                }
            });

        });

        this.load();
    }

    load() {
        this.clientWidth = this.clientMap.width;
        this.clientHeight = this.clientMap.height;

        this.mapRegions.forEachRegion((regionId) => {
            this.regions[regionId] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        this.loaded = true;

        log.info('Finished loading regions!');
    }

    addEntityToInstance(entity, player) {
        if (!entity)
            return;

        this.add(entity, player.region);

        player.updateRegion();
    }

    createInstance(player, regionId) {
        /**
         * We create an instance at the player's current surrounding
         * region IDs. These will have to be disposed of whenever we're done.
         */

        player.instanced = true;

        this.mapRegions.forEachSurroundingRegion(regionId, (region) => {
            this.regions[Region.regionIdToInstance(player, region)] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        this.handle(player, true);
        this.push(player);

        this.world.push(Packets.PushOpcode.OldRegions, {
            player: player,
            message: new Messages.Region(Packets.RegionOpcode.Update, {
                id: player.instance,
                type: "remove"
            })
        });

    }

    deleteInstance(player) {
        player.instanced = false;

        this.handle(player);
        this.push(player);

        this.mapRegions.forEachSurroundingRegion(player.region, (regionId) => {
            let instancedRegion = Region.regionIdToInstance(player, regionId);

            if (instancedRegion in this.regions)
                delete this.regions[instancedRegion];
        });
    }

    parseRegions() {
        if (!this.loaded)
            return;

        this.mapRegions.forEachRegion((regionId) => {

            if (this.regions[regionId].incoming.length < 1)
                return;

            this.sendSpawns(regionId);

            this.regions[regionId].incoming = [];
        });
    }

    // If `regionId` is not null, we update adjacent regions
    updateRegions(regionId) {
        if (regionId)
            this.mapRegions.forEachSurroundingRegion((regionId), (id) => {
                let region = this.regions[id];

                _.each(region.players, (instance) => {
                    let player = this.world.players[instance];

                    if (player)
                        this.sendRegion(player, player.region);
                });
            });
        else
            this.world.forEachPlayer((player) => {
                player.regionsLoaded = [];

                this.sendRegion(player, player.region, true);
            });
    }

    sendRegion(player, region, force) {
        let tileData = this.getRegionData(region, player, force),
            dynamicTiles = this.getDynamicTiles(player);

        // Send dynamic tiles alongside the region
        for (let i = 0; i < tileData.length; i++) {
            let tile = tileData[i],
                index = dynamicTiles.indexes.indexOf(tile.index);

            if (index > -1) {
                tileData[i].data = dynamicTiles.data[index];
                tileData[i].isCollision = dynamicTiles.collisions[index];
            }
        }

        // Send dynamic tiles independently
        if (tileData.length < 1)
            for (let i = 0; i < dynamicTiles.indexes.length; i++) {
                tileData[i] = {};

                tileData[i].index = dynamicTiles.indexes[i];
                tileData[i].data = dynamicTiles.data[i];
                tileData[i].isCollision = dynamicTiles.collisions[i];

                let data = dynamicTiles.objectData,
                    index = tileData[i].index;

                if (index in data) {
                    tileData[i].isObject = data[index].isObject;

                    if (data[index].cursor)
                        tileData[i].cursor = data[index].cursor;
                }
            }

        //No need to send empty data...
        if (tileData.length > 0)
            player.send(new Messages.Region(Packets.RegionOpcode.Render, tileData, force));
    }

    // TODO - Format dynamic tiles to follow same structure as `getRegionData()`
    getDynamicTiles(player) {
        let dynamicTiles = player.doors.getAllTiles(),
            trees = player.getSurroundingTrees();

        // Start with the doors and append afterwards.

        dynamicTiles.indexes.push.apply(dynamicTiles.indexes, trees.indexes);
        dynamicTiles.data.push.apply(dynamicTiles.data, trees.data);
        dynamicTiles.collisions.push.apply(dynamicTiles.collisions, trees.collisions);

        if (trees.objectData)
            dynamicTiles.objectData = trees.objectData;

        return dynamicTiles;
    }

    sendSpawns(regionId) {
        if (!regionId)
            return;

        _.each(this.regions[regionId].incoming, (entity) => {
            if (!entity || !entity.instance || entity.instanced)
                return;

            this.world.push(Packets.PushOpcode.Regions, {
                regionId: regionId,
                message: new Messages.Spawn(entity),
                ignoreId: entity.isPlayer() ? entity.instance : null
            })

        });
    }

    add(entity, regionId) {
        let newRegions = [];

        if (entity && regionId && (regionId in this.regions)) {
            this.mapRegions.forEachSurroundingRegion(regionId, (id) => {
                if (entity.instanced)
                    id = Region.regionIdToInstance(entity, id);

                let region = this.regions[id];

                if (region && region.entities) {
                    region.entities[entity.instance] = entity;
                    newRegions.push(id);
                }
            });

            entity.region = regionId;

            if (entity instanceof Player)
                this.regions[regionId].players.push(entity.instance);
        }

        if (this.addCallback)
            this.addCallback(entity, regionId);

        return newRegions;
    }

    remove(entity) {
        let oldRegions = [];

        if (entity && entity.region) {
            let region = this.regions[entity.region];

            if (entity instanceof Player)
                region.players = _.reject(region.players, (id) => { return id === entity.instance; });

            this.mapRegions.forEachSurroundingRegion(entity.region, (id) => {
                if (this.regions[id] && entity.instance in this.regions[id].entities) {
                    delete this.regions[id].entities[entity.instance];
                    oldRegions.push(id);
                }
            });

            entity.region = null;
        }

        if (this.removeCallback)
            this.removeCallback(entity, oldRegions);

        return oldRegions;
    }

    incoming(entity, regionId) {
        if (!entity || !regionId)
            return;

        let region = this.regions[regionId];

        if (region && !_.include(region.entities, entity.instance))
            region.incoming.push(entity);

        if (this.incomingCallback)
            this.incomingCallback(entity, regionId);
    }

    handle(entity, region?) {
        let regionsChanged = false;

        if (!entity)
            return regionsChanged;

        let regionId = region ? region : this.mapRegions.regionIdFromPosition(entity.x, entity.y);

        if (entity.instanced)
            regionId = Region.regionIdToInstance(entity, regionId);

        if (!entity.region || (entity.region && entity.region !== regionId)) {
            regionsChanged = true;

            this.incoming(entity, regionId);

            let oldRegions = this.remove(entity),
                newRegions = this.add(entity, regionId);

            if (_.size(oldRegions) > 0)
                entity.recentRegions = _.difference(oldRegions, newRegions);
        }

        return regionsChanged;
    }

    push(player) {
        let entities;

        if (!player || !(player.region in this.regions))
            return;

        entities = _.keys(this.regions[player.region].entities);

        entities = _.reject(entities, (instance) => {
            return instance === player.instance; //TODO //|| player.isInvisible(instance);
        });

        entities = _.map(entities, (instance) => {
            return parseInt(instance);
        });

        player.send(new Messages.List(entities));
    }

    changeTileAt(player, newTile, x, y) {
        let index = this.gridPositionToIndex(x, y);

        player.send(Region.getModify(index, newTile));
    }

    changeGlobalTile(newTile, x, y) {
        let index = this.gridPositionToIndex(x, y);

        this.clientMap.data[index] = newTile;

        this.world.push(Packets.PushOpcode.Broadcast, {
            message: Region.getModify(index, newTile)
        })

    }

    /**
     * Compare the user's screen size and chip away the amount of data
     * we are sending.
     */
    formatRegionData(player, data) {

    }

    getRegionData(region, player, force) {
        let data = [], cursor;

        if (!player)
            return data;

        this.mapRegions.forEachSurroundingRegion(region, (regionId) => {
            if (!player.hasLoadedRegion(regionId) || force) {
                player.loadRegion(regionId);

                let bounds = this.getRegionBounds(regionId);

                for (let y = bounds.startY; y < bounds.endY; y++) {
                    for (let x = bounds.startX; x < bounds.endX; x++) {
                        let index = this.gridPositionToIndex(x - 1, y),
                            tileData = this.clientMap.data[index],
                            isCollision = this.clientMap.collisions.indexOf(index) > -1 || !tileData,
                            objectId;

                        if (tileData !== 0) {

                            if (tileData instanceof Array) {

                                for (let j = 0; j < tileData.length; j++) {
                                    if (this.map.isObject(tileData[j])) {
                                        objectId = tileData[j];
                                        break;
                                    }
                                }
                            } else
                                if (this.map.isObject(tileData))
                                    objectId = tileData;
                        }

                        let info = {
                            index: index
                        };

                        if (tileData)
                            info.data = tileData;

                        if (isCollision)
                            info.isCollision = isCollision;

                        if (objectId) {
                            info.isObject = !!objectId;

                            let cursor = this.map.getCursor(info.index, objectId);

                            if (cursor)
                                info.cursor = cursor;
                        }

                        data.push(info);
                    }
                }
            }
        });

        return data;
    }

    getRegionBounds(regionId) {
        let regionCoordinates = this.mapRegions.regionIdToCoordinates(regionId);

        return {
            startX: regionCoordinates.x,
            startY: regionCoordinates.y,
            endX: regionCoordinates.x + this.map.regionWidth,
            endY: regionCoordinates.y + this.map.regionHeight
        }
    }

    static getModify(index, newTile) {
        return new Messages.Region(Packets.RegionOpcode.Modify, {
           index: index,
           newTile: newTile
        });
    }

    static instanceToRegionId(instancedRegionId) {
        let region = instancedRegionId.split('-');

        return region[0] + '-' + region[1];
    }

    static regionIdToInstance(player, regionId) {
        return regionId + '-' + player.instance;
    }

    gridPositionToIndex(x, y) {
        return (y * this.clientWidth) + x + 1;
    }

    onAdd(callback) {
        this.addCallback = callback;
    }

    onRemove(callback) {
        this.removeCallback = callback;
    }

    onIncoming(callback) {
        this.incomingCallback = callback;
    }
}

export default Region;
