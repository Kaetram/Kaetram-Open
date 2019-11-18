/* global module */

const Entity = require('../entity');
const Modules = require('../../../util/modules');
const Mobs = require('../../../util/mobs');
const Combat = require('./combat/combat');

class Character extends Entity {
    constructor(id, type, instance, x, y) {
        super(id, type, instance, x, y);

        const self = this;

        self.level = -1;

        self.movementSpeed = 150;
        self.attackRange = 1;
        self.attackRate = 1000;
        self.healingRate = 7000;

        self.spawnDistance = 7;

        self.previousX = -1;
        self.previousY = -1;

        self.hitPoints = -1;
        self.maxHitPoints = -1;

        self.dead = false;
        self.aggressive = false;
        self.aggroRange = 2;

        self.target = null;
        self.potentialTarget = null;

        self.stunTimeout = null;

        self.projectile = Modules.Projectiles.Arrow;
        self.projectileName = 'projectile-pinearrow';

        self.healingInterval = null;

        self.loadCombat();
        self.startHealing();
    }

    loadCombat() {
        const self = this;

        /**
         * Ternary could be used here, but readability
         * would become nonexistent.
         */

        if (Mobs.hasCombatPlugin(self.id))
            self.combat = new (Mobs.isNewCombatPlugin(self.id))(self);
        else
            self.combat = new Combat(self);
    }

    startHealing() {
        const self = this;

        self.healingInterval = setInterval(() => {
            if (!self.hasTarget() && !self.combat.isAttacked() && !self.dead)
                self.heal(1);
        }, 5000);
    }

    stopHealing() {
        const self = this;

        clearInterval(self.healingInterval);
        self.healingInterval = null;
    }

    setStun(stun) {
        const self = this;

        self.stunned = stun;

        if (self.stunCallback)
            self.stunCallback(stun);
    }

    hit(attacker) {
        const self = this;

        if (self.hitCallback)
            self.hitCallback(attacker);
    }

    heal(amount) {
        const self = this;

        self.setHitPoints(self.hitPoints + amount);

        if (self.hitPoints >= self.maxHitPoints)
            self.hitPoints = self.maxHitPoints;
    }

    addExperience() {
        // Unimplemented.
    }

    isRanged() {
        return this.attackRange > 1;
    }

    applyDamage(damage) {
        this.hitPoints -= damage;
    }

    isDead() {
        return this.hitPoints < 1 || this.dead;
    }

    getCombat() {
        return this.combat;
    }

    getHitPoints() {
        return this.hitPoints;
    }

    getMaxHitPoints() {
        return this.maxHitPoints;
    }

    setPosition(x, y) {
        const self = this;

        self.previousX = self.x;
        self.previousY = self.y;

        super.setPosition(x, y);

        if (self.movementCallback)
            self.movementCallback(x, y);
    }

    setTarget(target) {
        const self = this;

        self.target = target;

        if (self.targetCallback)
            self.targetCallback(target);
    }

    setPotentialTarget(potentialTarget) {
        this.potentialTarget = potentialTarget;
    }

    setHitPoints(hitPoints) {
        const self = this;

        self.hitPoints = hitPoints;

        if (self.hitPointsCallback)
            self.hitPointsCallback();
    }

    getProjectile() {
        return this.projectile;
    }

    getProjectileName() {
        return this.projectileName;
    }

    getDrop() {
        return null;
    }

    hasMaxHitPoitns() {
        return this.hitPoints >= this.maxHitPoints;
    }

    removeTarget() {
        const self = this;

        if (self.removeTargetCallback)
            self.removeTargetCallback();

        self.clearTarget();
    }

    hasTarget() {
        return !(this.target === null);
    }

    hasPotentialTarget(potentialTarget) {
        return this.potentialTarget === potentialTarget;
    }

    clearTarget() {
        this.target = null;
    }

    onTarget(callback) {
        this.targetCallback = callback;
    }

    onRemoveTarget(callback) {
        this.removeTargetCallback = callback;
    }

    onMovement(callback) {
        this.movementCallback = callback;
    }

    onHit(callback) {
        this.hitCallback = callback;
    }

    onHealthChange(callback) {
        this.healthChangeCallback = callback;
    }

    onDamage(callback) {
        this.damageCallback = callback;
    }

    onStunned(callback) {
        this.stunCallback = callback;
    }

    onSubAoE(callback) {
        this.subAoECallback = callback;
    }
}

module.exports = Character;
