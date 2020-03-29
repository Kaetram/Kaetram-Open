/* global module */

let _ = require('underscore'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets'),
    Player = require('../game/entity/character/player/player'),
    fs = require('fs'),
    ClientMap = require('../../data/map/world_client.json'),
    map = 'server/data/map/world_client.json';

class Region {

    /**
     * Region Generation.
     * This is used in order to send the client data about the new region
     * it is about to enter. This has to be greatly expanded to generated
     * instanced areas where other entities will not be pushed to surrounding
     * players, even if they share the same coordinates.
     */

    constructor(world) {
        let self = this;

        self.map = world.map;
        self.mapRegions = world.map.regions;

        self.world = world;

        self.regions = {};
        self.loaded = false;

        self.onAdd((entity, regionId) => {
            if (!entity || !entity.username)
                return;

            if (config.debug)
                log.info('Entity - ' + entity.username + ' has entered region - ' + regionId);

            if (entity instanceof Player) {
                if (!entity.questsLoaded)
                    return;

                if (!entity.achievementsLoaded)
                    return;

                self.sendRegion(entity, regionId);
            }
        });

        self.onRemove((entity, oldRegions) => {
            if (!oldRegions || oldRegions.length < 1 || !entity || !entity.username)
                return;
        });

        self.onIncoming((entity, regionId) => {
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

                    ClientMap = JSON.parse(data);

                    self.updateRegions();

                } catch(e) {
                    log.error('Could not parse JSON.');
                }
            });

        });

        self.load();
    }

    load() {
        let self = this;

        self.clientWidth = ClientMap.width;
        self.clientHeight = ClientMap.height;

        self.mapRegions.forEachRegion((regionId) => {
            self.regions[regionId] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        self.loaded = true;

        log.info('Finished loading regions!');
    }

    addEntityToInstance(entity, player) {
        let self = this;

        if (!entity)
            return;

        self.add(entity, player.region);

        player.updateRegion();
    }

    createInstance(player, regionId) {
        let self = this;

        /**
         * We create an instance at the player's current surrounding
         * region IDs. These will have to be disposed of whenever we're done.
         */

        player.instanced = true;

        self.mapRegions.forEachSurroundingRegion(regionId, (region) => {
            self.regions[Region.regionIdToInstance(player, region)] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        self.handle(player, true);
        self.push(player);

        self.world.push(Packets.PushOpcode.OldRegions, {
            player: player,
            message: new Messages.Region(Packets.RegionOpcode.Update, {
                id: player.instance,
                type: "remove"
            })
        });

    }

    deleteInstance(player) {
        let self = this;

        player.instanced = false;

        self.handle(player);
        self.push(player);

        self.mapRegions.forEachSurroundingRegion(player.region, (regionId) => {
            let instancedRegion = Region.regionIdToInstance(player, regionId);

            if (instancedRegion in self.regions)
                delete self.regions[instancedRegion];
        });
    }

    parseRegions() {
        let self = this;

        if (!self.loaded)
            return;

        self.mapRegions.forEachRegion((regionId) => {

            if (self.regions[regionId].incoming.length < 1)
                return;

            self.sendSpawns(regionId);

            self.regions[regionId].incoming = [];
        });
    }

    updateRegions() {
        let self = this;

        self.world.forEachPlayer((player) => {
            player.regionsLoaded = [];

            self.sendRegion(player, player.region, true);
        });
    }

    sendRegion(player, region, force) {
        let self = this,
            tileData = self.getRegionData(region, player, force),
            dynamicTiles = player.doors.getAllTiles();


        // Send dynamic tiles alongside the region
        for (let i = 0; i < tileData.length; i++) {
            let primaryTile = tileData[i],
                index = dynamicTiles.indexes.indexOf(primaryTile.index);

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
            }

        //No need to send empty data...
        if (tileData.length > 0)
            player.send(new Messages.Region(Packets.RegionOpcode.Render, tileData, force));
    }

    sendSpawns(regionId) {
        let self = this;

        if (!regionId)
            return;

        _.each(self.regions[regionId].incoming, (entity) => {
            if (!entity || !entity.instance || entity.instanced)
                return;

            self.world.push(Packets.PushOpcode.Regions, {
                regionId: regionId,
                message: new Messages.Spawn(entity),
                ignoreId: entity.isPlayer() ? entity.instance : null
            })

        });
    }

    add(entity, regionId) {
        let self = this,
            newRegions = [];

        if (entity && regionId && (regionId in self.regions)) {
            self.mapRegions.forEachSurroundingRegion(regionId, (id) => {
                if (entity.instanced)
                    id = Region.regionIdToInstance(entity, id);

                let region = self.regions[id];

                if (region && region.entities) {
                    region.entities[entity.instance] = entity;
                    newRegions.push(id);
                }
            });

            entity.region = regionId;

            if (entity instanceof Player)
                self.regions[regionId].players.push(entity.instance);
        }

        if (self.addCallback)
            self.addCallback(entity, regionId);

        return newRegions;
    }

    remove(entity) {
        let self = this,
            oldRegions = [];

        if (entity && entity.region) {
            let region = self.regions[entity.region];

            if (entity instanceof Player)
                region.players = _.reject(region.players, (id) => { return id === entity.instance; });

            self.mapRegions.forEachSurroundingRegion(entity.region, (id) => {
                if (self.regions[id] && entity.instance in self.regions[id].entities) {
                    delete self.regions[id].entities[entity.instance];
                    oldRegions.push(id);
                }
            });

            entity.region = null;
        }

        if (self.removeCallback)
            self.removeCallback(entity, oldRegions);

        return oldRegions;
    }

    incoming(entity, regionId) {
        let self = this;

        if (!entity || !regionId)
            return;

        let region = self.regions[regionId];

        if (region && !_.include(region.entities, entity.instance))
            region.incoming.push(entity);

        if (self.incomingCallback)
            self.incomingCallback(entity, regionId);
    }

    handle(entity, region) {
        let self = this,
            regionsChanged = false;

        if (!entity)
            return regionsChanged;

        let regionId = region ? region : self.mapRegions.regionIdFromPosition(entity.x, entity.y);

        if (entity.instanced)
            regionId = Region.regionIdToInstance(entity, regionId);

        if (!entity.region || (entity.region && entity.region !== regionId)) {
            regionsChanged = true;

            self.incoming(entity, regionId);

            let oldRegions = self.remove(entity),
                newRegions = self.add(entity, regionId);

            if (_.size(oldRegions) > 0)
                entity.recentRegions = _.difference(oldRegions, newRegions);
        }

        return regionsChanged;
    }

    push(player) {
        let self = this,
            entities;

        if (!player || !(player.region in self.regions))
            return;

        entities = _.keys(self.regions[player.region].entities);

        entities = _.reject(entities, (instance) => {
            return instance === player.instance; //TODO //|| player.isInvisible(instance);
        });

        entities = _.map(entities, (instance) => {
            return parseInt(instance);
        });

        player.send(new Messages.List(entities));
    }

    changeTileAt(player, newTile, x, y) {
        let self = this,
            index = self.gridPositionToIndex(x, y);

        player.send(Region.getModify(index, newTile));
    }

    changeGlobalTile(newTile, x, y) {
        let self = this,
            index = self.gridPositionToIndex(x, y);

        ClientMap.data[index] = newTile;

        self.world.push(Packets.PushOpcode.Broadcast, {
            message: Region.getModify(index, newTile)
        })

    }

    /**
     * Compare the user's screen size and chip away the amount of data
     * we are sending.
     */
    formatRegionData(player, data) {
        let self = this;
    }

    getRegionData(region, player, force) {
        let self = this,
            data = [];

        if (!player)
            return data;

        self.mapRegions.forEachSurroundingRegion(region, (regionId) => {
            if (!player.hasLoadedRegion(regionId) || force) {
                player.loadRegion(regionId);

                let bounds = self.getRegionBounds(regionId);

                for (let y = bounds.startY; y < bounds.endY; y++) {
                    for (let x = bounds.startX; x < bounds.endX; x++) {
                        let index = self.gridPositionToIndex(x - 1, y),
                            tileData = ClientMap.data[index],
                            isCollision = ClientMap.collisions.indexOf(index) > -1 || !tileData,
                            isObject = false;

                        if (tileData !== 0) {

                            if (tileData instanceof Array) {

                                for (let j = 0; j < tileData.length; j++) {
                                    if (self.map.isObject(tileData[j])) {
                                        isObject = true;
                                        break;
                                    }
                                }
                            } else
                                if (self.map.isObject(tileData))
                                    isObject = true;
                        }

                        let info = {
                            index: index
                        };

                        if (tileData)
                            info.data = tileData;

                        if (isCollision)
                            info.isCollision = isCollision;

                        if (isObject)
                            info.isObject = isObject;

                        data.push(info);
                    }
                }
            }
        });

        return data;
    }

    getRegionBounds(regionId) {
        let self = this,
            regionCoordinates = self.mapRegions.regionIdToCoordinates(regionId);

        return {
            startX: regionCoordinates.x,
            startY: regionCoordinates.y,
            endX: regionCoordinates.x + self.map.regionWidth,
            endY: regionCoordinates.y + self.map.regionHeight
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

module.exports = Region;
