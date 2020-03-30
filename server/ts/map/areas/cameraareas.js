"use strict";
exports.__esModule = true;
var _ = require("underscore");
var area_1 = require("../area");
var world_server_json_1 = require("../../../data/map/world_server.json");
/**
 *
 */
var CameraAreas = /** @class */ (function () {
    function CameraAreas() {
        this.cameraAreas = [];
        this.load();
    }
    CameraAreas.prototype.load = function () {
        var _this = this;
        var list = world_server_json_1["default"].cameraAreas;
        _.each(list, function (o) {
            var cameraArea = new area_1["default"](o.id, o.x, o.y, o.width, o.height);
            cameraArea.type = o.type;
            _this.cameraAreas.push(cameraArea);
        });
        console.info("Loaded " + this.cameraAreas.length + " camera areas.");
    };
    return CameraAreas;
}());
exports["default"] = CameraAreas;
