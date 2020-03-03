/** @format */

import Entity from '../entity';
import Modules from '../../../util/modules';
import Mobs from '../../../util/mobs';
import Combat from './combat/combat';

class Character extends Entity {
    public attackRange: any;
    public hitPoints: any;
    public dead: any;
    public combat: Combat;
    public maxHitPoints: any;
    public potentialTarget: any;
    public projectile: any;
    public projectileName: any;
    public target: any;
    public targetCallback: any;
    public removeTargetCallback: any;
    public movementCallback: any;
    public hitCallback: any;
    public healthChangeCallback: any;
    public damageCallback: any;
    public damagedCallback: any;
    public stunCallback: any;
    public subAoECallback: any;
    public poisonCallback: any;
    public id: any;
    public healingInterval: any;
    public poison: any;
    public healingRate: any;
    public stunned: any;
    public previousX: any;
    public x: any;
    public previousY: any;
    public y: any;
    public hitPointsCallback: any;
    public movementSpeed: any;
    region: any;
    level: number;
    attackRate: number;
    spawnDistance: number;
    aggressive: boolean;
    aggroRange: number;
    stunTimeout: any;

    constructor(id, type, instance, x, y) {
        super(id, type, instance, x, y);

        this.level = -1;

        this.movementSpeed = 250;
        this.attackRange = 1;
        this.attackRate = 1000;
        this.healingRate = 25000;

        this.spawnDistance = 7;

        this.previousX = -1;
        this.previousY = -1;

        this.hitPoints = -1;
        this.maxHitPoints = -1;

        /* States */
        this.dead = false;
        this.poison = false;
        this.aggressive = false;
        this.aggroRange = 2;

        this.target = null;
        this.potentialTarget = null;

        this.stunTimeout = null;

        this.projectile = Modules.Projectiles.Arrow;
        this.projectileName = 'projectile-pinearrow';

        this.healingInterval = null;

        this.loadCombat();
        this.startHealing();
    }

    loadCombat() {
        /**
         * Ternary could be used here, but readability
         * would become nonexistent.
         */

        if (Mobs.hasCombatPlugin(this.id)) {
            this.combat = new (Mobs.isNewCombatPlugin(this.id).default)(this);
        } else this.combat = new Combat(this);
    }

    startHealing() {
        this.healingInterval = setInterval(() => {
            if (this.dead) return;

            if (this.combat.started) return;

            if (this.poison) return;

            this.heal(1);
        }, this.healingRate);
    }

    stopHealing() {
        clearInterval(this.healingInterval);
        this.healingInterval = null;
    }

    setStun(stun) {
        this.stunned = stun;

        if (this.stunCallback) this.stunCallback(stun);
    }

    hit(attacker) {
        if (this.hitCallback) this.hitCallback(attacker);
    }

    heal(amount) {
        this.setHitPoints(this.hitPoints + amount);

        if (this.hitPoints >= this.maxHitPoints)
            this.hitPoints = this.maxHitPoints;
    }

    isRanged() {
        return this.attackRange > 1;
    }

    applyDamage(damage, attacker) {
        this.hitPoints -= damage;

        if (this.damagedCallback) this.damagedCallback(damage, attacker);
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
        this.previousX = this.x;
        this.previousY = this.y;

        super.setPosition(x, y);

        if (this.movementCallback) this.movementCallback(x, y);
    }

    setTarget(target) {
        this.target = target;

        if (this.targetCallback) this.targetCallback(target);
    }

    setPotentialTarget(potentialTarget) {
        this.potentialTarget = potentialTarget;
    }

    setHitPoints(hitPoints) {
        this.hitPoints = hitPoints;

        if (this.hitPointsCallback) this.hitPointsCallback();
    }

    setPoison(poison) {
        this.poison = poison;

        if (this.poisonCallback) this.poisonCallback(poison);
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

    getState() {
        const state = super.getState();

        state.movementSpeed = this.movementSpeed;

        return state;
    }

    hasMaxHitPoitns() {
        return this.hitPoints >= this.maxHitPoints;
    }

    removeTarget() {
        if (this.removeTargetCallback) this.removeTargetCallback();

        this.clearTarget();
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

    onDamaged(callback) {
        // When the entity gets hit.
        this.damagedCallback = callback;
    }

    onStunned(callback) {
        this.stunCallback = callback;
    }

    onSubAoE(callback) {
        this.subAoECallback = callback;
    }

    onPoison(callback) {
        this.poisonCallback = callback;
    }
}

export default Character;
