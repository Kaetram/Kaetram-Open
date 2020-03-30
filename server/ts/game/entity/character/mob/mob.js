"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var _ = require("underscore");
var character_1 = require("../character");
var mobs_1 = require("../../../../util/mobs");
var utils_1 = require("../../../../util/utils");
var items_1 = require("../../../../util/items");
var constants_1 = require("../../../../util/constants");
var mobhandler_1 = require("./mobhandler");
/**
 *
 */
var Mob = /** @class */ (function (_super) {
    __extends(Mob, _super);
    function Mob(id, instance, x, y, world) {
        var _this = _super.call(this, id, 'mob', instance, x, y) || this;
        if (!mobs_1["default"].exists(id))
            return _this;
        _this.world = world;
        _this.data = mobs_1["default"].Ids[_this.id];
        _this.hitPoints = _this.data.hitPoints;
        _this.maxHitPoints = _this.data.hitPoints;
        _this.drops = _this.data.drops;
        _this.respawnDelay = _this.data.spawnDelay;
        _this.level = _this.data.level;
        _this.armourLevel = _this.data.armour;
        _this.weaponLevel = _this.data.weapon;
        _this.attackRange = _this.data.attackRange;
        _this.aggroRange = _this.data.aggroRange;
        _this.aggressive = _this.data.aggressive;
        _this.attackRate = _this.data.attackRate;
        _this.spawnLocation = [x, y];
        _this.dead = false;
        _this.boss = false;
        _this.static = false;
        _this.hiddenName = false;
        _this.roaming = false;
        _this.maxRoamingDistance = 3;
        _this.projectileName = _this.getProjectileName();
        return _this;
    }
    Mob.prototype.load = function () {
        this.handler = new mobhandler_1["default"](this, this.world);
        if (this.loadCallback)
            this.loadCallback();
    };
    Mob.prototype.refresh = function () {
        this.hitPoints = this.data.hitPoints;
        this.maxHitPoints = this.data.hitPoints;
        if (this.refreshCallback)
            this.refreshCallback();
    };
    Mob.prototype.getDrop = function () {
        if (!this.drops)
            return null;
        var random = utils_1["default"].randomInt(0, constants_1["default"].DROP_PROBABILITY);
        var dropObjects = Object.keys(this.drops);
        var item = dropObjects[utils_1["default"].randomInt(0, dropObjects.length - 1)];
        if (random > this.drops[item])
            return null;
        var count = item === 'gold' ? this.level * 5 : 1;
        return {
            id: items_1["default"].stringToId(item),
            count: count
        };
    };
    Mob.prototype.getProjectileName = function () {
        return this.data.projectileName
            ? this.data.projectileName
            : 'projectile-pinearrow';
    };
    Mob.prototype.canAggro = function (player) {
        if (this.hasTarget())
            return false;
        if (!this.aggressive)
            return false;
        if (Math.floor(this.level * 1.5) < player.level &&
            !this.alwaysAggressive)
            return false;
        if (!player.hasAggressionTimer())
            return false;
        return this.isNear(player, this.aggroRange);
    };
    Mob.prototype.destroy = function () {
        this.dead = true;
        this.clearTarget();
        this.resetPosition();
        this.respawn();
        if (this.area)
            this.area.removeEntity(this);
    };
    Mob.prototype["return"] = function () {
        this.clearTarget();
        this.resetPosition();
        this.setPosition(this.x, this.y);
    };
    Mob.prototype.isRanged = function () {
        return this.attackRange > 1;
    };
    Mob.prototype.distanceToSpawn = function () {
        return this.getCoordDistance(this.spawnLocation[0], this.spawnLocation[1]);
    };
    Mob.prototype.isAtSpawn = function () {
        return (this.x === this.spawnLocation[0] && this.y === this.spawnLocation[1]);
    };
    Mob.prototype.isOutsideSpawn = function () {
        return this.distanceToSpawn() > this.spawnDistance;
    };
    Mob.prototype.addToChestArea = function (chestAreas) {
        var _this = this;
        var area = _.find(chestAreas, function (area) {
            return area.contains(_this.x, _this.y);
        });
        if (area)
            area.addEntity(this);
    };
    Mob.prototype.respawn = function () {
        /**
         * Some entities are static (only spawned once during an event)
         * Meanwhile, other entities act as an illusion to another entity,
         * so the resawning script is handled elsewhere.
         */
        var _this = this;
        if (!this.static || this.respawnDelay === -1)
            return;
        setTimeout(function () {
            if (_this.respawnCallback)
                _this.respawnCallback();
        }, this.respawnDelay);
    };
    Mob.prototype.getState = function () {
        var base = _super.prototype.getState.call(this);
        base.hitPoints = this.hitPoints;
        base.maxHitPoints = this.maxHitPoints;
        base.attackRange = this.attackRange;
        base.level = this.level;
        base.hiddenName = this.hiddenName; // TODO: Just don't send name when hiddenName present.
        return base;
    };
    // We take the plateau level of where the entity spawns.
    Mob.prototype.getPlateauLevel = function () {
        return this.world.map.getPlateauLevel(this.spawnLocation[0], this.spawnLocation[1]);
    };
    Mob.prototype.resetPosition = function () {
        this.setPosition(this.spawnLocation[0], this.spawnLocation[1]);
    };
    Mob.prototype.onLoad = function (callback) {
        this.loadCallback = callback;
    };
    Mob.prototype.onRespawn = function (callback) {
        this.respawnCallback = callback;
    };
    Mob.prototype.onReturn = function (callback) {
        this.returnCallback = callback;
    };
    Mob.prototype.onRefresh = function (callback) {
        this.refreshCallback = callback;
    };
    Mob.prototype.onDeath = function (callback) {
        this.deathCallback = callback;
    };
    return Mob;
}(character_1["default"]));
exports["default"] = Mob;
