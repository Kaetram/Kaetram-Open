import * as Modules from '@kaetram/common/src/modules';

import Mobs from '../../../util/mobs';
import Entity, { EntityState } from '../entity';
import Combat from './combat/combat';
import { HitData } from './combat/hit';
import Boots from './player/equipment/boots';
import Pendant from './player/equipment/pendant';
import Ring from './player/equipment/ring';

type DamageCallback = (target: Character, hitInfo: HitData) => void;
type StunCallback = (stun: boolean) => void;
type HitCallback = (attacker: Character, damage?: number) => void;
type DamagedCallback = (damage: number, attacker: Character) => void;
type MovementCallback = (x: number, y: number) => void;
type TargetCallback = (target: Pos) => void;
type PoisonCallback = (poison: string) => void;
type SubAoECallback = (radius: number, hasTerror: boolean) => void;

export interface CharacterState extends EntityState {
    movementSpeed: number;
}

export default class Character extends Entity {
    public level: number;
    public movementSpeed: number;
    public attackRange: number;
    public attackRate: number;
    public healingRate: number;

    public spawnDistance: number;

    public previousX: number;
    public previousY: number;

    public hitPoints: number;
    public maxHitPoints: number;

    public poison: string;
    public aggressive: boolean;
    public aggroRange: number;

    public target: Character;
    public potentialTarget: unknown; // TODO

    stunTimeout: NodeJS.Timeout;

    public projectile: Modules.Projectiles;
    public projectileName: string;

    healingInterval: NodeJS.Timeout;
    updated: boolean;

    public weaponLevel: number;
    public armourLevel: number;
    public stunned: boolean;

    stunCallback: StunCallback;
    hitCallback: HitCallback;
    damagedCallback: DamagedCallback;
    movementCallback: MovementCallback;
    targetCallback: TargetCallback;
    hitPointsCallback?(): void;
    poisonCallback: PoisonCallback;
    removeTargetCallback?(): void;
    healthChangeCallback?(): void;
    damageCallback: DamageCallback;
    subAoECallback: SubAoECallback;
    deathCallback?(): void;

    returnCallback?(): void;

    moving: boolean;
    lastMovement: number;

    pvp: boolean;

    spawnLocation: [x: number, y: number];

    frozen: boolean;

    alwaysAggressive: boolean;

    public invincible: boolean;
    public lastAttacker: Character;

    public pendant: Pendant;
    public ring: Ring;
    public boots: Boots;

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

    loadCombat(): void {
        /**
         * Ternary could be used here, but readability
         * would become nonexistent.
         */

        this.combat = Mobs.hasCombatPlugin(this.id)
            ? new (Mobs.isNewCombatPlugin(this.id))(this)
            : new Combat(this);
    }

    setMinibossData(): void {
        /* We only update the mob data once to prevent any issues. */

        if (this.updated) return;

        this.level += Math.floor(this.level / 2);
        this.maxHitPoints += Math.floor(this.maxHitPoints / 2);
        this.hitPoints = this.maxHitPoints;
        this.weaponLevel += 4;
        this.armourLevel += 3;

        this.updated = true;
    }

    startHealing(): void {
        this.healingInterval = setInterval(() => {
            if (this.dead) return;

            if (this.combat.started) return;

            if (this.poison) return;

            this.heal(1);
        }, this.healingRate);
    }

    stopHealing(): void {
        clearInterval(this.healingInterval);
        this.healingInterval = null;
    }

    setStun(stun: boolean): void {
        this.stunned = stun;

        if (this.stunCallback) this.stunCallback(stun);
    }

    hit(attacker: Character): void {
        if (this.hitCallback) this.hitCallback(attacker);
    }

    heal(amount: number): void {
        this.setHitPoints(this.hitPoints + amount);

        if (this.hitPoints >= this.maxHitPoints) this.hitPoints = this.maxHitPoints;
    }

    isRanged(): boolean {
        return this.attackRange > 1;
    }

    applyDamage(damage: number, attacker?: Character): void {
        this.hitPoints -= damage;

        if (this.damagedCallback) this.damagedCallback(damage, attacker);
    }

    isDead(): boolean {
        return this.hitPoints < 1 || this.dead;
    }

    getCombat(): Combat {
        return this.combat;
    }

    getHitPoints(): number {
        return this.hitPoints;
    }

    getMaxHitPoints(): number {
        return this.maxHitPoints;
    }

    setPosition(x: number, y: number): void {
        this.previousX = this.x;
        this.previousY = this.y;

        super.setPosition(x, y);

        if (this.movementCallback) this.movementCallback(x, y);
    }

    setTarget(target: Character): void {
        this.target = target;

        if (this.targetCallback) this.targetCallback(target);
    }

    setPotentialTarget(potentialTarget: unknown): void {
        this.potentialTarget = potentialTarget;
    }

    setHitPoints(hitPoints: number): void {
        this.hitPoints = hitPoints;

        if (this.hitPointsCallback) this.hitPointsCallback();
    }

    setPoison(poison: string): void {
        this.poison = poison;

        if (this.poisonCallback) this.poisonCallback(poison);
    }

    getProjectile(): Modules.Projectiles {
        return this.projectile;
    }

    getProjectileName(): string {
        return this.projectileName;
    }

    getWeaponLevel(): number {
        return this.weaponLevel;
    }

    getArmourLevel(): number {
        return this.armourLevel;
    }

    getState(): CharacterState {
        const state = super.getState() as CharacterState;

        state.movementSpeed = this.movementSpeed;

        return state;
    }

    hasMaxHitPoints(): boolean {
        return this.hitPoints >= this.maxHitPoints;
    }

    removeTarget(): void {
        if (this.removeTargetCallback) this.removeTargetCallback();

        this.clearTarget();
    }

    hasTarget(): boolean {
        return !(this.target === null);
    }

    hasPotentialTarget(potentialTarget: unknown): boolean {
        return this.potentialTarget === potentialTarget;
    }

    clearTarget(): void {
        this.target = null;
    }

    onTarget(callback: () => void): void {
        this.targetCallback = callback;
    }

    onRemoveTarget(callback: () => void): void {
        this.removeTargetCallback = callback;
    }

    onMovement(callback: MovementCallback): void {
        this.movementCallback = callback;
    }

    onHit(callback: HitCallback): void {
        this.hitCallback = callback;
    }

    onHealthChange(callback: () => void): void {
        this.healthChangeCallback = callback;
    }

    onDamage(callback: DamageCallback): void {
        this.damageCallback = callback;
    }

    /** When the entity gets hit. */
    onDamaged(callback: DamagedCallback): void {
        this.damagedCallback = callback;
    }

    onStunned(callback: StunCallback): void {
        this.stunCallback = callback;
    }

    onSubAoE(callback: SubAoECallback): void {
        this.subAoECallback = callback;
    }

    onPoison(callback: PoisonCallback): void {
        this.poisonCallback = callback;
    }

    onDeath(callback: () => void): void {
        this.deathCallback = callback;
    }

    onReturn(callback: () => void): void {
        this.returnCallback = callback;
    }
}
