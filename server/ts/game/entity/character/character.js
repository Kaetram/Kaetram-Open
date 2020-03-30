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
var mobs_1 = require("../../../util/mobs");
var modules_1 = require("../../../util/modules");
var entity_1 = require("../entity");
var combat_1 = require("./combat/combat");
/**
 *
 */
var Character = /** @class */ (function (_super) {
    __extends(Character, _super);
    /**
     * Creates an instance of Character.
     * @param id -
     * @param type -
     * @param instance -
     * @param x -
     * @param y -
     */
    function Character(id, type, instance, x, y) {
        var _this = _super.call(this, id, type, instance, x, y) || this;
        _this.id = id;
        _this.type = type;
        _this.instance = instance;
        _this.x = x;
        _this.y = y;
        _this.level = -1;
        _this.movementSpeed = 250;
        _this.attackRange = 1;
        _this.attackRate = 1000;
        _this.healingRate = 25000;
        _this.spawnDistance = 7;
        _this.previousX = -1;
        _this.previousY = -1;
        _this.hitPoints = -1;
        _this.maxHitPoints = -1;
        /* States */
        _this.dead = false;
        _this.poison = false;
        _this.aggressive = false;
        _this.aggroRange = 2;
        _this.target = null;
        _this.potentialTarget = null;
        _this.stunTimeout = null;
        _this.projectile = modules_1["default"].Projectiles.Arrow;
        _this.projectileName = 'projectile-pinearrow';
        _this.healingInterval = null;
        _this.loadCombat();
        _this.startHealing();
        return _this;
    }
    Character.prototype.loadCombat = function () {
        /**
         * Ternary could be used here, but readability
         * would become nonexistent.
         */
        if (mobs_1["default"].hasCombatPlugin(this.id)) {
            // eslint-disable-next-line new-cap
            this.combat = new (mobs_1["default"].isNewCombatPlugin(this.id)["default"])(this);
        }
        else
            this.combat = new combat_1["default"](this);
    };
    Character.prototype.startHealing = function () {
        var _this = this;
        this.healingInterval = setInterval(function () {
            if (_this.dead)
                return;
            if (_this.combat.started)
                return;
            if (_this.poison)
                return;
            _this.heal(1);
        }, this.healingRate);
    };
    Character.prototype.stopHealing = function () {
        clearInterval(this.healingInterval);
        this.healingInterval = null;
    };
    Character.prototype.setStun = function (stun) {
        this.stunned = stun;
        if (this.stunCallback)
            this.stunCallback(stun);
    };
    Character.prototype.hit = function (attacker) {
        if (this.hitCallback)
            this.hitCallback(attacker);
    };
    Character.prototype.heal = function (amount) {
        this.setHitPoints(this.hitPoints + amount);
        if (this.hitPoints >= this.maxHitPoints)
            this.hitPoints = this.maxHitPoints;
    };
    Character.prototype.isRanged = function () {
        return this.attackRange > 1;
    };
    Character.prototype.applyDamage = function (damage, attacker) {
        this.hitPoints -= damage;
        if (this.damagedCallback)
            this.damagedCallback(damage, attacker);
    };
    Character.prototype.isDead = function () {
        return this.hitPoints < 1 || this.dead;
    };
    Character.prototype.getCombat = function () {
        return this.combat;
    };
    Character.prototype.getHitPoints = function () {
        return this.hitPoints;
    };
    Character.prototype.getMaxHitPoints = function () {
        return this.maxHitPoints;
    };
    Character.prototype.setPosition = function (x, y) {
        this.previousX = this.x;
        this.previousY = this.y;
        _super.prototype.setPosition.call(this, x, y);
        if (this.movementCallback)
            this.movementCallback(x, y);
    };
    Character.prototype.setTarget = function (target) {
        this.target = target;
        if (this.targetCallback)
            this.targetCallback(target);
    };
    Character.prototype.setPotentialTarget = function (potentialTarget) {
        this.potentialTarget = potentialTarget;
    };
    Character.prototype.setHitPoints = function (hitPoints) {
        this.hitPoints = hitPoints;
        if (this.hitPointsCallback)
            this.hitPointsCallback();
    };
    Character.prototype.setPoison = function (poison) {
        this.poison = poison;
        if (this.poisonCallback)
            this.poisonCallback(poison);
    };
    Character.prototype.getProjectile = function () {
        return this.projectile;
    };
    Character.prototype.getProjectileName = function () {
        return this.projectileName;
    };
    Character.prototype.getDrop = function () {
        return null;
    };
    Character.prototype.getState = function () {
        var state = _super.prototype.getState.call(this);
        state.movementSpeed = this.movementSpeed;
        return state;
    };
    Character.prototype.hasMaxHitPoitns = function () {
        return this.hitPoints >= this.maxHitPoints;
    };
    Character.prototype.removeTarget = function () {
        if (this.removeTargetCallback)
            this.removeTargetCallback();
        this.clearTarget();
    };
    Character.prototype.hasTarget = function () {
        return !(this.target === null);
    };
    Character.prototype.hasPotentialTarget = function (potentialTarget) {
        return this.potentialTarget === potentialTarget;
    };
    Character.prototype.clearTarget = function () {
        this.target = null;
    };
    Character.prototype.onTarget = function (callback) {
        this.targetCallback = callback;
    };
    Character.prototype.resetPosition = function () {
        this.setPosition(this.spawnLocation[0], this.spawnLocation[1]);
    };
    Character.prototype["return"] = function () {
        this.clearTarget();
        this.resetPosition();
        this.setPosition(this.x, this.y);
    };
    Character.prototype.onRemoveTarget = function (callback) {
        this.removeTargetCallback = callback;
    };
    Character.prototype.onMovement = function (callback) {
        this.movementCallback = callback;
    };
    Character.prototype.onHit = function (callback) {
        this.hitCallback = callback;
    };
    Character.prototype.onHealthChange = function (callback) {
        this.healthChangeCallback = callback;
    };
    Character.prototype.onDamage = function (callback) {
        this.damageCallback = callback;
    };
    Character.prototype.onDamaged = function (callback) {
        // When the entity gets hit.
        this.damagedCallback = callback;
    };
    Character.prototype.onStunned = function (callback) {
        this.stunCallback = callback;
    };
    Character.prototype.onSubAoE = function (callback) {
        this.subAoECallback = callback;
    };
    Character.prototype.onPoison = function (callback) {
        this.poisonCallback = callback;
    };
    Character.prototype.hasBreakableWeapon = function () {
        throw new Error('Method not implemented.');
    };
    Character.prototype.breakWeapon = function () {
        throw new Error('Method not implemented.');
    };
    Character.prototype.getHit = function (target) {
        throw new Error('Method not implemented.');
    };
    return Character;
}(entity_1["default"]));
exports["default"] = Character;
