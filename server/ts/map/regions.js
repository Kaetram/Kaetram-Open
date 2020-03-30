"use strict";
exports.__esModule = true;
var _ = require("underscore");
var world_server_json_1 = require("../../data/map/world_server.json");
/**
 *
 */
var Regions = /** @class */ (function () {
    function Regions(map) {
        this.map = map;
        this.width = this.map.width;
        this.height = this.map.height;
        this.zoneWidth = this.map.zoneWidth;
        this.zoneHeight = this.map.zoneHeight;
        this.regionWidth = this.map.regionWidth;
        this.regionHeight = this.map.regionHeight;
        this.linkedRegions = {};
        this.loadDoors();
    }
    Regions.prototype.loadDoors = function () {
        var _this = this;
        var doors = world_server_json_1["default"].doors;
        _.each(doors, function (door) {
            var regionId = _this.regionIdFromPosition(door.x, door.y);
            var linkedRegionId = _this.regionIdFromPosition(door.tx, door.ty);
            var linkedRegionPosition = _this.regionIdToPosition(linkedRegionId);
            if (regionId in _this.linkedRegions)
                _this.linkedRegions[regionId].push(linkedRegionPosition);
            else
                _this.linkedRegions[regionId] = [linkedRegionPosition];
        });
    };
    // y y x y y
    // y y x y y
    // y x x x y
    // y y x y x
    // y y x y y
    Regions.prototype.getAdjacentRegions = function (id, offset, stringFormat) {
        var _this = this;
        if (offset === void 0) { offset = 1; }
        var position = this.regionIdToPosition(id);
        var x = position.x;
        var y = position.y;
        var list = [];
        for (var i = -offset; i <= offset; i++ // y
        )
            for (var j = -1; j <= 1; j++ // x
            )
                if (i > -2 || i < 2)
                    list.push(stringFormat
                        ? x + j + "-" + (y + i)
                        : { x: x + j, y: y + i });
        _.each(this.linkedRegions[id], function (regionPosition) {
            if (!_.any(list, function (regionPosition) {
                return regionPosition.x === x && regionPosition.y === y;
            }))
                list.push(regionPosition);
        });
        return _.reject(list, function (regionPosition) {
            var gX = regionPosition.x;
            var gY = regionPosition.y;
            return (gX < 0 ||
                gY < 0 ||
                gX >= _this.regionWidth ||
                gY >= _this.regionHeight);
        });
    };
    Regions.prototype.forEachRegion = function (callback) {
        for (var x = 0; x < this.regionWidth; x++)
            for (var y = 0; y < this.regionHeight; y++)
                callback(x + "-" + y);
    };
    Regions.prototype.forEachAdjacentRegion = function (regionId, callback, offset) {
        if (!regionId)
            return;
        _.each(this.getAdjacentRegions(regionId, offset), function (position) {
            callback(position.x + "-" + position.y);
        });
    };
    Regions.prototype.regionIdFromPosition = function (x, y) {
        return Math.floor(x / this.zoneWidth) + "-" + Math.floor(y / this.zoneHeight);
    };
    Regions.prototype.regionIdToPosition = function (id) {
        var position = id.split('-');
        return {
            x: parseInt(position[0], 10),
            y: parseInt(position[1], 10)
        };
    };
    Regions.prototype.regionIdToCoordinates = function (id) {
        var position = id.split('-');
        return {
            x: parseInt(position[0]) * this.zoneWidth,
            y: parseInt(position[1]) * this.zoneHeight
        };
    };
    Regions.prototype.isAdjacent = function (regionId, toRegionId) {
        return (this.getAdjacentRegions(regionId, 1, true).indexOf(regionId) > -1);
    };
    return Regions;
}());
exports["default"] = Regions;
