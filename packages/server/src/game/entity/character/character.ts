import * as Modules from '@kaetram/common/src/modules';

import Mobs from '../../../util/mobs';
import Entity, { EntityState } from '../entity';
import Combat from './combat/combat';

import type { HitData } from './combat/hit';
import type Boots from './player/equipment/boots';
import type Pendant from './player/equipment/pendant';
import type Ring from './player/equipment/ring';

type DamageCallback = (target: Character, hitInfo: HitData) => void;
type StunCallback = (stun: boolean) => void;
type HitCallback = (attacker: Character, damage?: number) => void;
type DamagedCallback = (damage: number, attacker?: Character) => void;
type MovementCallback = (x: number, y: number) => void;
type TargetCallback = (target: Character | null) => void;
type PoisonCallback = (poison: string) => void;
type SubAoECallback = (radius: number, hasTerror: boolean) => void;

export interface CharacterState extends EntityState {
    movementSpeed: number;
}

export default abstract class Character extends Entity {
    public level = -1;

    public movementSpeed = 250;
    public attackRange = 1;
    public attackRate = 1000;
    public healingRate = 10000;

    public spawnDistance = 7;

    public previousX = -1;
    public previousY = -1;

    public hitPoints = -1;
    public maxHitPoints = -1;

    /* States */
    public poison: string | null = null;
    public aggressive = false;
    public aggroRange = 2;

    public target: Character | null = null;
    public potentialTarget: unknown = null;

    stunTimeout: NodeJS.Timeout | null = null;

    public projectile = Modules.Projectiles.Arrow;
    public projectileName = 'projectile-pinearrow';

    healingInterval: NodeJS.Timeout | null = null;

    updated = false;

    public weaponLevel!: number;
    public armourLevel!: number;
    public stunned = false;

    stunCallback?: StunCallback;
    hitCallback?: HitCallback;
    damagedCallback?: DamagedCallback;
    movementCallback?: MovementCallback;
    targetCallback?: TargetCallback;
    hitPointsCallback?(): void;
    poisonCallback?: PoisonCallback;
    removeTargetCallback?(): void;
    healthChangeCallback?(): void;
    damageCallback?: DamageCallback;
    subAoECallback?: SubAoECallback;
    deathCallback?(): void;

    returnCallback?(): void;

    moving = false;
    lastMovement!: number;

    pvp = false;

    spawnLocation!: [x: number, y: number];

    frozen = false;

    alwaysAggressive = false;

    public invincible = false;
    public lastAttacker!: Character | null;

    public pendant!: Pendant;
    public ring!: Ring;
    public boots!: Boots;

    constructor(id: number, type: string, instance: string, x: number, y: number) {
        super(id, type, instance, x, y);

        this.loadCombat();
        this.startHealing();
    }

    loadCombat(): void {
        /**
         * Ternary could be used here, but readability
         * would become nonexistent.
         */

        this.combat = Mobs.hasCombatPlugin(this.id)
            ? new (Mobs.isNewCombatPlugin(this.id)!)(this)
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
        if (this.healingInterval) clearInterval(this.healingInterval);
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

    override setPosition(x: number, y: number): void {
        this.previousX = this.x;
        this.previousY = this.y;

        super.setPosition(x, y);

        if (this.movementCallback) this.movementCallback(x, y);
    }

    setTarget(target: Character | null): void {
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

    override getState(): CharacterState {
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

    hasPotentialTarget(potentialTarget: unknown): boolean {
        return this.potentialTarget === potentialTarget;
    }

    clearTarget(): void {
        this.target = null;
    }

    onTarget(callback: TargetCallback): void {
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
