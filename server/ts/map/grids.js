"use strict";
exports.__esModule = true;
var _ = require("underscore");
/**
 *
 */
var Grids = /** @class */ (function () {
    function Grids(map) {
        this.map = map;
        this.entityGrid = [];
        this.load();
    }
    Grids.prototype.load = function () {
        for (var i = 0; i < this.map.height; i++) {
            this.entityGrid[i] = [];
            for (var j = 0; j < this.map.width; j++)
                this.entityGrid[i][j] = {};
        }
    };
    Grids.prototype.updateEntityPosition = function (entity) {
        if (entity && entity.oldX === entity.x && entity.oldY === entity.y)
            return;
        this.removeFromEntityGrid(entity, entity.oldX, entity.oldY);
        this.addToEntityGrid(entity, entity.x, entity.y);
        entity.updatePosition();
    };
    Grids.prototype.addToEntityGrid = function (entity, x, y) {
        if (entity &&
            x > 0 &&
            y > 0 &&
            x < this.map.width &&
            x < this.map.height &&
            this.entityGrid[y][x])
            this.entityGrid[y][x][entity.instance] = entity;
    };
    Grids.prototype.removeFromEntityGrid = function (entity, x, y) {
        if (entity &&
            x > 0 &&
            y > 0 &&
            x < this.map.width &&
            y < this.map.height &&
            this.entityGrid[y][x] &&
            entity.instance in this.entityGrid[y][x])
            delete this.entityGrid[y][x][entity.instance];
    };
    Grids.prototype.getSurroundingEntities = function (entity, radius, include) {
        var entities = [];
        if (!this.checkBounds(entity.x, entity.y, radius))
            return;
        for (var i = -radius; i < radius + 1; i++) {
            for (var j = -radius; j < radius + 1; j++) {
                var pos = this.entityGrid[entity.y + i][entity.x + j];
                if (_.size(pos) > 0) {
                    _.each(pos, function (pEntity) {
                        if (!include && pEntity.instance !== entity.instance)
                            entities.push(pEntity);
                    });
                }
            }
        }
        return entities;
    };
    Grids.prototype.checkBounds = function (x, y, radius) {
        return (x + radius < this.map.width &&
            x - radius > 0 &&
            y + radius < this.map.height &&
            y - radius > 0);
    };
    return Grids;
}());
exports["default"] = Grids;
