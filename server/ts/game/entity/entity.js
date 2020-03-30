"use strict";
exports.__esModule = true;
var mobs_1 = require("../../util/mobs");
var items_1 = require("../../util/items");
var npcs_1 = require("../../util/npcs");
/**
 *
 */
var Entity = /** @class */ (function () {
    /**
     * Creates an instance of Entity.
     * @param id - A unique id given to each entity.
     * @param type -
     * @param instance -
     * @param x - The x position of the entity.
     * @param y - The y position of the entity.
     */
    function Entity(id, type, instance, x, y) {
        this.id = id;
        this.type = type;
        this.instance = instance;
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.combat = null;
        this.dead = false;
        this.recentRegions = [];
        this.invisibles = {}; // For Entity Instances
        this.invisiblesIds = []; // For Entity IDs
    }
    Entity.prototype.getCombat = function () {
        return null;
    };
    Entity.prototype.getDistance = function (entity) {
        var x = Math.abs(this.x - entity.x);
        var y = Math.abs(this.y - entity.y);
        return x > y ? x : y;
    };
    Entity.prototype.getCoordDistance = function (toX, toY) {
        var x = Math.abs(this.x - toX);
        var y = Math.abs(this.y - toY);
        return x > y ? x : y;
    };
    Entity.prototype.setPosition = function (x, y) {
        this.x = x;
        this.y = y;
        if (this.setPositionCallback)
            this.setPositionCallback();
    };
    Entity.prototype.updatePosition = function () {
        this.oldX = this.x;
        this.oldY = this.y;
    };
    /**
     * Used for determining whether an entity is
     * within a given range to another entity.
     * Especially useful for ranged attacks and whatnot.
     */
    Entity.prototype.isNear = function (entity, distance) {
        var dx = Math.abs(this.x - entity.x);
        var dy = Math.abs(this.y - entity.y);
        return dx <= distance && dy <= distance;
    };
    Entity.prototype.isAdjacent = function (entity) {
        return entity && this.getDistance(entity) < 2;
    };
    Entity.prototype.isNonDiagonal = function (entity) {
        return (this.isAdjacent(entity) &&
            !(entity.x !== this.x && entity.y !== this.y));
    };
    Entity.prototype.hasSpecialAttack = function () {
        return false;
    };
    Entity.prototype.isMob = function () {
        return this.type === 'mob';
    };
    Entity.prototype.isNPC = function () {
        return this.type === 'npc';
    };
    Entity.prototype.isItem = function () {
        return this.type === 'item';
    };
    Entity.prototype.isPlayer = function () {
        return this.type === 'player';
    };
    Entity.prototype.onSetPosition = function (callback) {
        this.setPositionCallback = callback;
    };
    Entity.prototype.addInvisible = function (entity) {
        this.invisibles[entity.instance] = entity;
    };
    Entity.prototype.addInvisibleId = function (entityId) {
        this.invisiblesIds.push(entityId);
    };
    Entity.prototype.removeInvisible = function (entity) {
        delete this.invisibles[entity.instance];
    };
    Entity.prototype.removeInvisibleId = function (entityId) {
        var index = this.invisiblesIds.indexOf(entityId);
        if (index > -1)
            this.invisiblesIds.splice(index, 1);
    };
    Entity.prototype.hasInvisible = function (entity) {
        return entity.instance in this.invisibles;
    };
    Entity.prototype.hasInvisibleId = function (entityId) {
        return this.invisiblesIds.indexOf(entityId) > -1;
    };
    Entity.prototype.hasInvisibleInstance = function (instance) {
        return instance in this.invisibles;
    };
    Entity.prototype.getState = function () {
        var string = this.isMob()
            ? mobs_1["default"].idToString(this.id)
            : this.isNPC()
                ? npcs_1["default"].idToString(this.id)
                : items_1["default"].idToString(this.id);
        var name = this.isMob()
            ? mobs_1["default"].idToName(this.id)
            : this.isNPC()
                ? npcs_1["default"].idToName(this.id)
                : items_1["default"].idToName(this.id);
        var data = {
            type: this.type,
            id: this.instance,
            string: string,
            name: name,
            x: this.x,
            y: this.y
        };
        if (this.specialState)
            data.nameColour = this.getNameColour();
        if (this.customScale)
            data.customScale = this.customScale;
        return data;
    };
    Entity.prototype.getNameColour = function () {
        switch (this.specialState) {
            case 'boss':
                return '#660033';
            case 'miniboss':
                return '#cc3300';
            case 'achievementNpc':
                return '#669900';
            case 'area':
                return '#00aa00';
            case 'questNpc':
                return '#6699ff';
            case 'questMob':
                return '#0099cc';
        }
    };
    Entity.prototype.canAggro = function (player) {
        throw new Error('Method not implemented.');
    };
    return Entity;
}());
exports["default"] = Entity;
