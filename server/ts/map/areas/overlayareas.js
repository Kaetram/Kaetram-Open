"use strict";
exports.__esModule = true;
var _ = require("underscore");
var area_1 = require("../area");
var world_server_json_1 = require("../../../data/map/world_server.json");
/**
 *
 */
var OverlayAreas = /** @class */ (function () {
    function OverlayAreas() {
        this.overlayAreas = [];
        this.load();
    }
    OverlayAreas.prototype.load = function () {
        var _this = this;
        var list = world_server_json_1["default"].overlayAreas;
        _.each(list, function (o) {
            var overlayArea = new area_1["default"](o.id, o.x, o.y, o.width, o.height);
            overlayArea.darkness = o.darkness;
            overlayArea.type = o.type;
            if (o.fog)
                overlayArea.fog = o.fog;
            _this.overlayAreas.push(overlayArea);
        });
        console.info("Loaded " + this.overlayAreas.length + " overlay areas.");
    };
    return OverlayAreas;
}());
exports["default"] = OverlayAreas;
