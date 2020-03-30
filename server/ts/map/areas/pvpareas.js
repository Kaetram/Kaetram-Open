"use strict";
exports.__esModule = true;
var _ = require("underscore");
var area_1 = require("../area");
var world_server_json_1 = require("../../../data/map/world_server.json");
/**
 *
 */
var PVPAreas = /** @class */ (function () {
    function PVPAreas() {
        this.pvpAreas = [];
        this.load();
    }
    PVPAreas.prototype.load = function () {
        var _this = this;
        var list = world_server_json_1["default"].pvpAreas;
        _.each(list, function (p) {
            var pvpArea = new area_1["default"](p.id, p.x, p.y, p.width, p.height);
            _this.pvpAreas.push(pvpArea);
        });
        console.info("Loaded " + this.pvpAreas.length + " PVP areas.");
    };
    return PVPAreas;
}());
exports["default"] = PVPAreas;
