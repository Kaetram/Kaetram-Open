"use strict";
exports.__esModule = true;
var _ = require("underscore");
var grids_1 = require("./grids");
var regions_1 = require("./regions");
var utils_1 = require("../util/utils");
var modules_1 = require("../util/modules");
var pvpareas_1 = require("./areas/pvpareas");
var musicareas_1 = require("./areas/musicareas");
var chestareas_1 = require("./areas/chestareas");
var world_server_json_1 = require("../../data/map/world_server.json");
var spawns_json_1 = require("../../data/spawns.json");
var overlayareas_1 = require("./areas/overlayareas");
var cameraareas_1 = require("./areas/cameraareas");
var world_client_json_1 = require("../../data/map/world_client.json");
/**
 *
 */
var Map = /** @class */ (function () {
    function Map(world) {
        this.world = world;
        this.ready = false;
        this.load();
        this.regions = new regions_1["default"](this);
        this.grids = new grids_1["default"](this);
    }
    Map.prototype.load = function () {
        var _this = this;
        this.version = world_server_json_1["default"].version || 0;
        this.width = world_server_json_1["default"].width;
        this.height = world_server_json_1["default"].height;
        this.collisions = world_server_json_1["default"].collisions;
        this.chestAreas = world_server_json_1["default"].chestAreas;
        this.chests = world_server_json_1["default"].chests;
        this.loadStaticEntities();
        this.tilesets = world_server_json_1["default"].tilesets;
        this.lights = world_server_json_1["default"].lights;
        this.plateau = world_server_json_1["default"].plateau;
        this.objects = world_server_json_1["default"].objects;
        this.zoneWidth = 25;
        this.zoneHeight = 20;
        this.regionWidth = Math.floor(this.width / this.zoneWidth);
        this.regionHeight = Math.floor(this.height / this.zoneHeight);
        this.areas = {};
        this.loadAreas();
        this.loadDoors();
        this.ready = true;
        this.readyInterval = setInterval(function () {
            if (!_this.world.ready)
                if (_this.readyCallback)
                    _this.readyCallback();
                else {
                    clearInterval(_this.readyInterval);
                    _this.readyInterval = null;
                }
        }, 50);
    };
    Map.prototype.loadAreas = function () {
        /**
         * The structure for the new this.areas is as follows:
         *
         * ```
         * this.areas = {
         *      pvpAreas = {
         *          allPvpAreas
         *      },
         *
         *      musicAreas = {
         *          allMusicAreas
         *      },
         *
         *      ...
         * }
         * ```
         */
        this.areas.PVP = new pvpareas_1["default"]();
        this.areas.Music = new musicareas_1["default"]();
        this.areas.Chests = new chestareas_1["default"](this.world);
        this.areas.Overlays = new overlayareas_1["default"]();
        this.areas.Cameras = new cameraareas_1["default"]();
    };
    Map.prototype.loadDoors = function () {
        var _this = this;
        this.doors = {};
        _.each(world_server_json_1["default"].doors, function (door) {
            var orientation;
            switch (door.o) {
                case 'u':
                    orientation = modules_1["default"].Orientation.Up;
                    break;
                case 'd':
                    orientation = modules_1["default"].Orientation.Down;
                    break;
                case 'l':
                    orientation = modules_1["default"].Orientation.Left;
                    break;
                case 'r':
                    orientation = modules_1["default"].Orientation.Right;
                    break;
            }
            _this.doors[_this.gridPositionToIndex(door.x, door.y)] = {
                x: door.tx,
                y: door.ty,
                orientation: orientation,
                portal: door.p ? door.p : 0,
                level: door.l,
                achievement: door.a,
                rank: door.r
            };
        });
    };
    Map.prototype.loadStaticEntities = function () {
        var _this = this;
        this.staticEntities = [];
        // Legacy static entities (from Tiled);
        _.each(world_server_json_1["default"].staticEntities, function (entity, tileIndex) {
            _this.staticEntities.push({
                tileIndex: tileIndex,
                string: entity.type,
                roaming: entity.roaming
            });
        });
        _.each(spawns_json_1["default"], function (data) {
            var tileIndex = _this.gridPositionToIndex(data.x - 1, data.y);
            _this.staticEntities.push({
                tileIndex: tileIndex,
                string: data.string,
                roaming: data.roaming,
                miniboss: data.miniboss,
                boss: data.boss
            });
        });
    };
    Map.prototype.indexToGridPosition = function (tileIndex) {
        tileIndex -= 1;
        var x = this.getX(tileIndex + 1, this.width);
        var y = Math.floor(tileIndex / this.width);
        return {
            x: x,
            y: y
        };
    };
    Map.prototype.gridPositionToIndex = function (x, y) {
        return y * this.width + x + 1;
    };
    Map.prototype.getX = function (index, width) {
        if (index === 0)
            return 0;
        return index % width === 0 ? width - 1 : (index % width) - 1;
    };
    Map.prototype.getRandomPosition = function (area) {
        var pos = {};
        var valid = false;
        while (!valid) {
            pos.x = area.x + utils_1["default"].randomInt(0, area.width + 1);
            pos.y = area.y + utils_1["default"].randomInt(0, area.height + 1);
            valid = this.isValidPosition(pos.x, pos.y);
        }
        return pos;
    };
    Map.prototype.inArea = function (posX, posY, x, y, width, height) {
        return (posX >= x && posY >= y && posX <= width + x && posY <= height + y);
    };
    Map.prototype.inTutorialArea = function (entity) {
        if (entity.x === -1 || entity.y === -1)
            return true;
        return (this.inArea(entity.x, entity.y, 370, 36, 10, 10) ||
            this.inArea(entity.x, entity.y, 312, 11, 25, 22) ||
            this.inArea(entity.x, entity.y, 399, 18, 20, 15));
    };
    Map.prototype.nearLight = function (light, x, y) {
        var diff = Math.round(light.distance / 16);
        var startX = light.x - this.zoneWidth - diff;
        var startY = light.y - this.zoneHeight - diff;
        var endX = light.x + this.zoneWidth + diff;
        var endY = light.y + this.zoneHeight + diff;
        return x > startX && y > startY && x < endX && y < endY;
    };
    Map.prototype.isObject = function (id) {
        return this.objects.indexOf(id) > -1;
    };
    Map.prototype.isDoor = function (x, y) {
        return !!this.doors[this.gridPositionToIndex(x, y)];
    };
    Map.prototype.getDoorDestination = function (x, y) {
        return this.doors[this.gridPositionToIndex(x, y)];
    };
    Map.prototype.isValidPosition = function (x, y) {
        return (x.isInteger() &&
            y.isInteger() &&
            !this.isOutOfBounds(x, y) &&
            !this.isColliding(x, y));
    };
    Map.prototype.isOutOfBounds = function (x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    };
    Map.prototype.isPlateau = function (index) {
        return index in this.plateau;
    };
    Map.prototype.isColliding = function (x, y) {
        if (this.isOutOfBounds(x, y))
            return false;
        var tileIndex = this.gridPositionToIndex(x - 1, y);
        return this.collisions.indexOf(tileIndex) > -1;
    };
    /* For preventing NPCs from roaming in null areas. */
    Map.prototype.isEmpty = function (x, y) {
        if (this.isOutOfBounds(x, y))
            return true;
        var tileIndex = this.gridPositionToIndex(x - 1, y);
        return world_client_json_1["default"].data[tileIndex] === 0;
    };
    Map.prototype.getPlateauLevel = function (x, y) {
        var index = this.gridPositionToIndex(x - 1, y);
        if (!this.isPlateau(index))
            return 0;
        return this.plateau[index];
    };
    Map.prototype.getActualTileIndex = function (tileIndex) {
        var tileset = this.getTileset(tileIndex);
        if (!tileset)
            return;
        return tileIndex - tileset.firstGID - 1;
    };
    Map.prototype.getTileset = function (tileIndex) {
        // if (
        //     id > this.tilesets[idx].firstGID - 1 &&
        //     id < this.tilesets[idx].lastGID + 1
        // )
        //     return this.tilesets[idx];
        for (var id in this.tilesets)
            if (this.tilesets.hasOwnProperty(id))
                if (tileIndex > this.tilesets[id].firstGID - 1 &&
                    tileIndex < this.tilesets[id].lastGID + 1)
                    return this.tilesets[id];
        return null;
    };
    Map.prototype.isReady = function (callback) {
        this.readyCallback = callback;
    };
    return Map;
}());
exports["default"] = Map;
