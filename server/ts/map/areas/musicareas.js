"use strict";
exports.__esModule = true;
var _ = require("underscore");
var area_1 = require("../area");
var world_server_json_1 = require("../../../data/map/world_server.json");
/**
 *
 */
var MusicAreas = /** @class */ (function () {
    function MusicAreas() {
        this.musicAreas = [];
        this.load();
    }
    MusicAreas.prototype.load = function () {
        var _this = this;
        _.each(world_server_json_1["default"].musicAreas, function (m) {
            var musicArea = new area_1["default"](m.id, m.x, m.y, m.width, m.height);
            _this.musicAreas.push(musicArea);
        });
        console.info("Loaded " + this.musicAreas.length + " music areas.");
    };
    return MusicAreas;
}());
exports["default"] = MusicAreas;
