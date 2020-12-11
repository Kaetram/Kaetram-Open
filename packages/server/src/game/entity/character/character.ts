import Entity from '../entity';
import Modules from '../../../util/modules';
import Mobs from '../../../util/mobs';
import Combat from './combat/combat';
import log from '../../../util/log';

class Character extends Entity {
    public level: number;
    public movementSpeed: number;
    public attackRange: number;
    public attackRate: number;
    public healingRate: number;

    public spawnDistance: number;

    public previousX: number;
    public previousY: number;

    public hitPoints: any;
    public maxHitPoints: number;

    public poison: string;
    public aggressive: boolean;
    public aggroRange: number;

    public target: any; // TODO
    public potentialTarget: any; // TODO

    stunTimeout: any;

    public projectile: any;
    public projectileName: string;

    healingInterval: any;
    updated: boolean;

    public weaponLevel: number;
    public armourLevel: number;
    public stunned: boolean;

    stunCallback: Function;
    hitCallback: Function;
    damagedCallback: Function;
    movementCallback: Function;
    targetCallback: Function;
    hitPointsCallback: Function;
    poisonCallback: Function;
    removeTargetCallback: Function;
    healthChangeCallback: Function;
    damageCallback: Function;
    subAoECallback: Function;
    deathCallback: Function;
    onReturn: Function;

    moving: boolean;
    lastMovement: number;

    pvp: boolean;

    spawnLocation: any;

    frozen: boolean;

    alwaysAggressive: boolean;

    public invincible: boolean;
    public lastAttacker: Character;

    public pendant: any;
    public ring: any;
    public boots: any;

    constructor(id: number, type: string, instance: string, x: number, y: number) {
        super(id, type, instance, x, y);

        this.level = -1;

        this.movementSpeed = 250;
        this.attackRange = 1;
        this.attackRate = 1000;
        this.healingRate = 10000;

        this.spawnDistance = 7;

        this.previousX = -1;
        this.previousY = -1;

        this.hitPoints = -1;
        this.maxHitPoints = -1;

        /* States */
        this.dead = false;
        this.poison = null;
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

        if (Mobs.hasCombatPlugin(this.id))
            this.combat = new (Mobs.isNewCombatPlugin(this.id))(this);
        else this.combat = new Combat(this);
    }

    setMinibossData() {
        /* We only update the mob data once to prevent any issues. */

        if (this.updated) return;

        this.level += Math.floor(this.level / 2);
        this.maxHitPoints += Math.floor(this.maxHitPoints / 2);
        this.hitPoints = this.maxHitPoints;
        this.weaponLevel += 4;
        this.armourLevel += 3;

        this.updated = true;
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

    setStun(stun: boolean) {
        this.stunned = stun;

        if (this.stunCallback) this.stunCallback(stun);
    }

    hit(attacker: Entity) {
        if (this.hitCallback) this.hitCallback(attacker);
    }

    heal(amount: number) {
        this.setHitPoints(this.hitPoints + amount);

        if (this.hitPoints >= this.maxHitPoints) this.hitPoints = this.maxHitPoints;
    }

    isRanged() {
        return this.attackRange > 1;
    }

    applyDamage(damage: number, attacker?: Character) {
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

    setPosition(x: number, y: number) {
        this.previousX = this.x;
        this.previousY = this.y;

        super.setPosition(x, y);

        if (this.movementCallback) this.movementCallback(x, y);
    }

    setTarget(target: any) {
        this.target = target;

        if (this.targetCallback) this.targetCallback(target);
    }

    setPotentialTarget(potentialTarget: any) {
        this.potentialTarget = potentialTarget;
    }

    setHitPoints(hitPoints: number) {
        this.hitPoints = hitPoints;

        if (this.hitPointsCallback) this.hitPointsCallback();
    }

    setPoison(poison: string) {
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

    getWeaponLevel() {
        return this.weaponLevel;
    }

    getArmourLevel() {
        return this.armourLevel;
    }

    getState() {
        let state = super.getState();

        state.movementSpeed = this.movementSpeed;

        return state;
    }

    hasMaxHitPoitns() {
        return this.hitPoints >= this.maxHitPoints;
    }

    /* Uninitialized Functions */

    hasBreakableWeapon() {
        return false;
    }

    breakWeapon() {}

    return() {}

    destroy() {}

    die() {}

    getHit(target?: any): any {
        return `uninitialized ${target.instance}`;
    }

    finishAchievement(id: number): any {
        return `uninitialized achievementId: ${id}`;
    }

    addExperience(exp: number) {
        log.debug(`Unimplemented \`addExperience\` ${exp}`);
    }

    canAggro(character: Character): boolean {
        log.debug(`Can ${this.instance} aggro ${character.instance}`);

        return false;
    }

    killCharacter(character: Character): any {
        log.debug(`Uninitialized \`killCharacter\` for ${character.instance}.`);
    }

    /*********************/

    removeTarget() {
        if (this.removeTargetCallback) this.removeTargetCallback();

        this.clearTarget();
    }

    hasTarget() {
        return !(this.target === null);
    }

    hasPotentialTarget(potentialTarget: any) {
        return this.potentialTarget === potentialTarget;
    }

    clearTarget() {
        this.target = null;
    }

    onTarget(callback: Function) {
        this.targetCallback = callback;
    }

    onRemoveTarget(callback: Function) {
        this.removeTargetCallback = callback;
    }

    onMovement(callback: Function) {
        this.movementCallback = callback;
    }

    onHit(callback: Function) {
        this.hitCallback = callback;
    }

    onHealthChange(callback: Function) {
        this.healthChangeCallback = callback;
    }

    onDamage(callback: Function) {
        this.damageCallback = callback;
    }

    onDamaged(callback: Function) {
        // When the entity gets hit.
        this.damagedCallback = callback;
    }

    onStunned(callback: Function) {
        this.stunCallback = callback;
    }

    onSubAoE(callback: Function) {
        this.subAoECallback = callback;
    }

    onPoison(callback: Function) {
        this.poisonCallback = callback;
    }

    onDeath(callback: Function) {
        this.deathCallback = callback;
    }
}

export default Character;
