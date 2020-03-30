"use strict";
exports.__esModule = true;
var _ = require("underscore");
var doors_json_1 = require("../../../../../data/doors.json");
var config_1 = require("../../../../../config");
/**
 *
 */
var Doors = /** @class */ (function () {
    function Doors(player) {
        this.world = player.world;
        this.player = player;
        this.map = this.world.map;
        this.regions = this.map.regions;
        this.doors = {};
        this.load();
    }
    Doors.prototype.load = function () {
        var _this = this;
        _.each(doors_json_1["default"], function (door) {
            _this.doors[door.id] = {
                id: door.id,
                x: door.x,
                y: door.y,
                status: door.status,
                requirement: door.requirement,
                level: door.level,
                questId: door.questId,
                achievementId: door.achievementId,
                closedIds: door.closedIds,
                openIds: door.openIds
            };
        });
    };
    Doors.prototype.getStatus = function (door) {
        if (door.status)
            return door.status;
        if (config_1["default"].offlineMode)
            return true;
        switch (door.requirement) {
            case 'quest':
                var quest = this.player.quests.getQuest(door.questId);
                return quest && quest.hasDoorUnlocked(door) ? 'open' : 'closed';
            case 'achievement':
                var achievement = this.player.quests.achievements[door.achievementId];
                return achievement && achievement.isFinished()
                    ? 'open'
                    : 'closed';
            case 'level':
                return this.player.level >= door.level ? 'open' : 'closed';
        }
    };
    Doors.prototype.getTiles = function (door) {
        var tiles = {
            indexes: [],
            data: [],
            collisions: []
        };
        var status = this.getStatus(door);
        var doorState = {
            open: door.openIds,
            closed: door.closedIds
        };
        _.each(doorState[status], function (value, key) {
            tiles.indexes.push(parseInt(key));
            tiles.data.push(value.data);
            tiles.collisions.push(value.isColliding);
        });
        return tiles;
    };
    Doors.prototype.getAllTiles = function () {
        var _this = this;
        var allTiles = {
            indexes: [],
            data: [],
            collisions: []
        };
        _.each(this.doors, function (door) {
            var _a, _b, _c;
            /* There's no need to send dynamic data if the player is not nearby. */
            var doorRegion = _this.regions.regionIdFromPosition(door.x, door.y);
            if (!_this.regions.isAdjacent(_this.player.region, doorRegion))
                return;
            var tiles = _this.getTiles(door);
            (_a = allTiles.indexes).push.apply(_a, tiles.indexes);
            (_b = allTiles.data).push.apply(_b, tiles.data);
            (_c = allTiles.collisions).push.apply(_c, tiles.collisions);
        });
        return allTiles;
    };
    Doors.prototype.hasCollision = function (x, y) {
        var tiles = this.getAllTiles();
        var tileIndex = this.world.map.gridPositionToIndex(x, y) - 1;
        var index = tiles.indexes.indexOf(tileIndex);
        /**
         * We look through the indexes of the door json file and
         * only process for collision when tile exists in the index.
         * The index represents the key in `openIds` and `closedIds`
         * in doors.json file.
         */
        if (index < 0)
            // Tile does not exist.
            return false;
        return tiles.collisions[index];
    };
    Doors.prototype.getDoor = function (x, y, callback) {
        for (var i in this.doors)
            if (this.doors.hasOwnProperty(i))
                if (this.doors[i].x === x && this.doors[i].y === y)
                    return this.doors[i];
        return null;
    };
    Doors.prototype.isDoor = function (x, y, callback) {
        this.forEachDoor(function (door) {
            callback(door.x === x && door.y === y);
        });
    };
    Doors.prototype.forEachDoor = function (callback) {
        _.each(this.doors, function (door) {
            callback(door);
        });
    };
    return Doors;
}());
exports["default"] = Doors;
