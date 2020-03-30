"use strict";
exports.__esModule = true;
var Area = /** @class */ (function () {
    function Area(id, x, y, width, height) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.entities = [];
        this.items = [];
        this.hasRespawned = true;
        this.chest = null;
        this.maxEntities = 0;
        this.spawnDelay = 0;
    }
    Area.prototype.contains = function (x, y) {
        return (x >= this.x &&
            y >= this.y &&
            x < this.x + this.width &&
            y < this.y + this.height);
    };
    Area.prototype.addEntity = function (entity) {
        if (this.entities.indexOf(entity) > 0)
            return;
        this.entities.push(entity);
        entity.area = this;
        // Grab a spawn delay from an mob to create an offset for the chest.
        if (!this.spawnDelay)
            this.spawnDelay = entity.respawnDelay;
        if (this.spawnCallback)
            this.spawnCallback();
    };
    Area.prototype.removeEntity = function (entity) {
        var index = this.entities.indexOf(entity);
        if (index > -1)
            this.entities.splice(index, 1);
        if (this.entities.length === 0 && this.emptyCallback) {
            if (entity.lastAttacker && entity.lastAttacker.type === 'player')
                this.handleAchievement(entity.lastAttacker);
            this.emptyCallback();
        }
    };
    Area.prototype.handleAchievement = function (entity) {
        if (!this.achievement)
            return;
        entity.finishAchievement(this.achievement);
    };
    Area.prototype.setMaxEntities = function (maxEntities) {
        this.maxEntities = maxEntities;
    };
    Area.prototype.onEmpty = function (callback) {
        this.emptyCallback = callback;
    };
    Area.prototype.onSpawn = function (callback) {
        this.spawnCallback = callback;
    };
    return Area;
}());
exports["default"] = Area;
