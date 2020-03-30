"use strict";
exports.__esModule = true;
var _ = require("underscore");
var fs_1 = require("fs");
var messages_1 = require("../network/messages");
var packets_1 = require("../network/packets");
var player_1 = require("../game/entity/character/player/player");
var world_client_json_1 = require("../../data/map/world_client.json");
var config_1 = require("../../config");
var ClientMap = world_client_json_1["default"];
var map = 'server/../data/map/world_client.json';
/**
 * Region Generation.
 *
 * @remarks
 * This is used in order to send the client data about the new region
 * it is about to enter. This has to be greatly expanded to generated
 * instanced areas where other entities will not be pushed to surrounding
 * players, even if they share the same coordinates.
 */
var Region = /** @class */ (function () {
    function Region(world) {
        var _this = this;
        this.map = world.map;
        this.mapRegions = world.map.regions;
        this.world = world;
        this.regions = {};
        this.loaded = false;
        this.onAdd(function (entity, regionId) {
            if (!entity || !entity.username)
                return;
            if (config_1["default"].debug)
                console.info("Entity - " + entity.username + " has entered region - " + regionId);
            if (entity instanceof player_1["default"])
                _this.sendRegion(entity, regionId);
        });
        this.onRemove(function (entity, oldRegions) {
            if (!oldRegions ||
                oldRegions.length < 1 ||
                !entity ||
                !entity.username)
                // eslint-disable-next-line no-useless-return
                return;
        });
        this.onIncoming(function (entity, regionId) {
            if (!entity || !entity.username)
                return;
            if (config_1["default"].debug)
                console.info("Entity - " + entity.username + " is incoming into region - " + regionId);
        });
        fs_1["default"].watchFile(map, function () {
            console.info('Received Map Update -> Sending to Players...');
            fs_1["default"].readFile(map, 'utf8', function (error, data) {
                if (error) {
                    console.info('Could not reload the map file...');
                    return;
                }
                try {
                    ClientMap = JSON.parse(data);
                    _this.updateRegions();
                }
                catch (e) {
                    console.info('Could not parse JSON.');
                }
            });
        });
        this.load();
    }
    Region.prototype.load = function () {
        var _this = this;
        this.clientWidth = ClientMap.width;
        this.clientHeight = ClientMap.height;
        this.mapRegions.forEachRegion(function (regionId) {
            _this.regions[regionId] = {
                entities: {},
                players: [],
                incoming: []
            };
        });
        this.loaded = true;
        console.info('Finished loading regions!');
    };
    Region.prototype.addEntityToInstance = function (entity, player) {
        if (!entity)
            return;
        this.add(entity, player.region);
        player.updateRegion();
    };
    Region.prototype.createInstance = function (player, regionId) {
        /**
         * We create an instance at the player's current surrounding
         * region IDs. These will have to be disposed of whenever we're done.
         */
        var _this = this;
        player.instanced = true;
        this.mapRegions.forEachAdjacentRegion(regionId, function (region) {
            _this.regions[Region.regionIdToInstance(player, region)] = {
                entities: {},
                players: [],
                incoming: []
            };
        });
        this.handle(player, true);
        this.push(player);
        this.world.push(packets_1["default"].PushOpcode.OldRegions, {
            player: player,
            message: new messages_1["default"].Region(packets_1["default"].RegionOpcode.Update, {
                id: player.instance,
                type: 'remove'
            })
        });
    };
    Region.prototype.deleteInstance = function (player) {
        var _this = this;
        player.instanced = false;
        this.handle(player);
        this.push(player);
        this.mapRegions.forEachAdjacentRegion(player.region, function (regionId) {
            var instancedRegion = Region.regionIdToInstance(player, regionId);
            if (instancedRegion in _this.regions)
                delete _this.regions[instancedRegion];
        });
    };
    Region.prototype.parseRegions = function () {
        var _this = this;
        if (!this.loaded)
            return;
        this.mapRegions.forEachRegion(function (regionId) {
            if (_this.regions[regionId].incoming.length < 1)
                return;
            _this.sendSpawns(regionId);
            _this.regions[regionId].incoming = [];
        });
    };
    Region.prototype.updateRegions = function () {
        var _this = this;
        this.world.forEachPlayer(function (player) {
            player.regionsLoaded = [];
            _this.sendRegion(player, player.region, true);
        });
    };
    Region.prototype.sendRegion = function (player, region, force) {
        var tileData = this.getRegionData(region, player, force);
        var dynamicTiles = player.doors.getAllTiles();
        // Send dynamic tiles alongside the region
        for (var i = 0; i < tileData.length; i++) {
            var primaryTile = tileData[i];
            var index = dynamicTiles.indexes.indexOf(primaryTile.index);
            if (index > -1) {
                tileData[i].data = dynamicTiles.data[index];
                tileData[i].isCollision = dynamicTiles.collisions[index];
            }
        }
        // Send dynamic tiles independently
        if (tileData.length < 1)
            for (var i = 0; i < dynamicTiles.indexes.length; i++) {
                tileData[i] = {};
                tileData[i].index = dynamicTiles.indexes[i];
                tileData[i].data = dynamicTiles.data[i];
                tileData[i].isCollision = dynamicTiles.collisions[i];
            }
        // No need to send empty data...
        if (tileData.length > 0)
            player.send(new messages_1["default"].Region(packets_1["default"].RegionOpcode.Render, tileData, force));
    };
    Region.prototype.sendSpawns = function (regionId) {
        var _this = this;
        if (!regionId)
            return;
        _.each(this.regions[regionId].incoming, function (entity) {
            if (!entity || !entity.instance || entity.instanced)
                return;
            _this.world.push(packets_1["default"].PushOpcode.Regions, {
                regionId: regionId,
                message: new messages_1["default"].Spawn(entity),
                ignoreId: entity.isPlayer() ? entity.instance : null
            });
        });
    };
    Region.prototype.add = function (entity, regionId) {
        var _this = this;
        var newRegions = [];
        if (entity && regionId && regionId in this.regions) {
            this.mapRegions.forEachAdjacentRegion(regionId, function (id) {
                if (entity.instanced)
                    id = Region.regionIdToInstance(entity, id);
                var region = _this.regions[id];
                if (region && region.entities) {
                    region.entities[entity.instance] = entity;
                    newRegions.push(id);
                }
            });
            entity.region = regionId;
            if (entity instanceof player_1["default"])
                this.regions[regionId].players.push(entity.instance);
        }
        if (this.addCallback)
            this.addCallback(entity, regionId);
        return newRegions;
    };
    Region.prototype.remove = function (entity) {
        var _this = this;
        var oldRegions = [];
        if (entity && entity.region) {
            var region = this.regions[entity.region];
            if (entity instanceof player_1["default"])
                region.players = _.reject(region.players, function (id) {
                    return id === entity.instance;
                });
            this.mapRegions.forEachAdjacentRegion(entity.region, function (id) {
                if (_this.regions[id] &&
                    entity.instance in _this.regions[id].entities) {
                    delete _this.regions[id].entities[entity.instance];
                    oldRegions.push(id);
                }
            });
            entity.region = null;
        }
        if (this.removeCallback)
            this.removeCallback(entity, oldRegions);
        return oldRegions;
    };
    Region.prototype.incoming = function (entity, regionId) {
        if (!entity || !regionId)
            return;
        var region = this.regions[regionId];
        if (region && !_.include(region.entities, entity.instance))
            region.incoming.push(entity);
        if (this.incomingCallback)
            this.incomingCallback(entity, regionId);
    };
    Region.prototype.handle = function (entity, region) {
        var regionsChanged = false;
        if (!entity)
            return regionsChanged;
        var regionId = region || this.mapRegions.regionIdFromPosition(entity.x, entity.y);
        if (entity.instanced)
            regionId = Region.regionIdToInstance(entity, regionId);
        if (!entity.region || (entity.region && entity.region !== regionId)) {
            regionsChanged = true;
            this.incoming(entity, regionId);
            var oldRegions = this.remove(entity);
            var newRegions = this.add(entity, regionId);
            if (_.size(oldRegions) > 0)
                entity.recentRegions = _.difference(oldRegions, newRegions);
        }
        return regionsChanged;
    };
    Region.prototype.push = function (player) {
        var entities;
        if (!player || !(player.region in this.regions))
            return;
        entities = _.keys(this.regions[player.region].entities);
        entities = _.reject(entities, function (instance) {
            return instance === player.instance; // TODO //|| player.isInvisible(instance);
        });
        entities = _.map(entities, function (instance) {
            return parseInt(instance);
        });
        player.send(new messages_1["default"].List(entities));
    };
    Region.prototype.changeTileAt = function (player, newTile, x, y) {
        var index = this.gridPositionToIndex(x, y);
        player.send(Region.getModify(index, newTile));
    };
    Region.prototype.changeGlobalTile = function (newTile, x, y) {
        var index = this.gridPositionToIndex(x, y);
        ClientMap.data[index] = newTile;
        this.world.push(packets_1["default"].PushOpcode.Broadcast, {
            message: Region.getModify(index, newTile)
        });
    };
    Region.prototype.getRegionData = function (region, player, force) {
        var _this = this;
        var data = [];
        if (!player)
            return data;
        this.mapRegions.forEachAdjacentRegion(region, function (regionId) {
            if (!player.hasLoadedRegion(regionId) || force) {
                player.loadRegion(regionId);
                var bounds = _this.getRegionBounds(regionId);
                for (var i = 0, y = bounds.startY; y <= bounds.endY; y++, i++) {
                    for (var x = bounds.startX; x < bounds.endX; x++) {
                        var index = _this.gridPositionToIndex(x - 1, y);
                        var tileData = ClientMap.data[index];
                        var isCollision = ClientMap.collisions.indexOf(index) > -1 ||
                            !tileData;
                        var isObject = false;
                        if (tileData !== 0) {
                            if (tileData instanceof Array) {
                                for (var j = 0; j < tileData.length; j++) {
                                    if (_this.map.isObject(tileData[j])) {
                                        isObject = true;
                                        break;
                                    }
                                }
                            }
                            else if (_this.map.isObject(tileData))
                                isObject = true;
                        }
                        var info = {
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
        }, 2);
        return data;
    };
    Region.prototype.getRegionBounds = function (regionId) {
        var regionCoordinates = this.mapRegions.regionIdToCoordinates(regionId);
        return {
            startX: regionCoordinates.x,
            startY: regionCoordinates.y,
            endX: regionCoordinates.x + this.map.regionWidth,
            endY: regionCoordinates.y + this.map.regionHeight
        };
    };
    Region.getModify = function (index, newTile) {
        return new messages_1["default"].Region(packets_1["default"].RegionOpcode.Modify, {
            index: index,
            newTile: newTile
        });
    };
    Region.instanceToRegionId = function (instancedRegionId) {
        var region = instancedRegionId.split('-');
        return region[0] + "-" + region[1];
    };
    Region.regionIdToInstance = function (player, regionId) {
        return regionId + "-" + player.instance;
    };
    Region.prototype.gridPositionToIndex = function (x, y) {
        return y * this.clientWidth + x + 1;
    };
    Region.prototype.onAdd = function (callback) {
        this.addCallback = callback;
    };
    Region.prototype.onRemove = function (callback) {
        this.removeCallback = callback;
    };
    Region.prototype.onIncoming = function (callback) {
        this.incomingCallback = callback;
    };
    return Region;
}());
exports["default"] = Region;
