"use strict";
exports.__esModule = true;
var _ = require("underscore");
var area_1 = require("../area");
var world_server_json_1 = require("../../../data/map/world_server.json");
/**
 *
 */
var ChestAreas = /** @class */ (function () {
    function ChestAreas(world) {
        this.world = world;
        this.chestAreas = [];
        this.load();
    }
    ChestAreas.prototype.load = function () {
        var _this = this;
        _.each(world_server_json_1["default"].chestAreas, function (m) {
            var chestArea = new area_1["default"](m.id, m.x, m.y, m.width, m.height);
            chestArea.maxEntities = m.entities || 0;
            chestArea.items = m.titems.split(',');
            chestArea.cX = parseInt(m.tx);
            chestArea.cY = parseInt(m.ty);
            if (m.tachievement)
                chestArea.achievement = parseInt(m.tachievement);
            _this.chestAreas.push(chestArea);
            chestArea.onEmpty(function () {
                _this.spawnChest(chestArea);
            });
            chestArea.onSpawn(function () {
                _this.removeChest(chestArea);
            });
        });
        console.info("Loaded " + this.chestAreas.length + " chest areas.");
    };
    ChestAreas.prototype.spawnChest = function (chestArea) {
        if (new Date().getTime() - chestArea.lastSpawn < chestArea.spawnDelay)
            return;
        chestArea.chest = this.world.spawnChest(chestArea.items, chestArea.cX, chestArea.cY, false);
        chestArea.lastSpawn = new Date().getTime();
    };
    ChestAreas.prototype.removeChest = function (chestArea) {
        if (!chestArea.chest)
            return;
        this.world.removeChest(chestArea.chest);
        chestArea.chest = null;
    };
    return ChestAreas;
}());
exports["default"] = ChestAreas;
