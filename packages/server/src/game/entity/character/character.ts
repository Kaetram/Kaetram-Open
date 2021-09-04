import { Modules } from '@kaetram/common/network';

import Mobs from '../../../util/mobs';
import Entity, { EntityState } from '../entity';
import Combat from './combat/combat';

import type { HitData } from '@kaetram/common/types/info';
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
    public healingRate = 10_000;

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

    public stunTimeout: NodeJS.Timeout | null = null;

    public projectile = Modules.Projectiles.Arrow;
    public projectileName = 'projectile-pinearrow';

    private healingInterval: NodeJS.Timeout | null = null;

    private updated = false;

    public weaponLevel!: number;
    public armourLevel!: number;
    public stunned = false;

    private stunCallback?: StunCallback;
    public hitCallback?: HitCallback;
    private damagedCallback?: DamagedCallback;
    private movementCallback?: MovementCallback;
    private targetCallback?: TargetCallback;
    private hitPointsCallback?(): void;
    private poisonCallback?: PoisonCallback;
    private removeTargetCallback?(): void;
    private healthChangeCallback?(): void;
    public damageCallback?: DamageCallback;
    private subAoECallback?: SubAoECallback;
    public deathCallback?(): void;
    private returnCallback?(): void;

    public moving = false;
    public lastMovement!: number;

    public pvp = false;

    public spawnLocation!: [x: number, y: number];

    public frozen = false;

    public alwaysAggressive = false;

    public invincible = false;
    public lastAttacker!: Character | null;

    public pendant!: Pendant;
    public ring!: Ring;
    public boots!: Boots;

    protected constructor(id: number, type: string, instance: string, x: number, y: number) {
        super(id, type, instance, x, y);

        this.loadCombat();
        this.startHealing();
    }

    private loadCombat(): void {
        /**
         * Ternary could be used here, but readability
         * would become nonexistent.
         */

        this.combat = Mobs.hasCombatPlugin(this.id)
            ? new (Mobs.isNewCombatPlugin(this.id)!)(this)
            : new Combat(this);
    }

    public setMinibossData(): void {
        /* We only update the mob data once to prevent any issues. */

        if (this.updated) return;

        this.level += Math.floor(this.level / 2);
        this.maxHitPoints += Math.floor(this.maxHitPoints / 2);
        this.hitPoints = this.maxHitPoints;
        this.weaponLevel += 4;
        this.armourLevel += 3;

        this.updated = true;
    }

    private startHealing(): void {
        this.healingInterval = setInterval(() => {
            if (this.dead) return;

            if (this.combat.started) return;

            if (this.poison) return;

            this.heal(1);
        }, this.healingRate);
    }

    public stopHealing(): void {
        if (this.healingInterval) clearInterval(this.healingInterval);
        this.healingInterval = null;
    }

    public setStun(stun: boolean): void {
        this.stunned = stun;

        this.stunCallback?.(stun);
    }

    public hit(attacker: Character): void {
        this.hitCallback?.(attacker);
    }

    public heal(amount: number): void {
        this.setHitPoints(this.hitPoints + amount);

        if (this.hitPoints >= this.maxHitPoints) this.hitPoints = this.maxHitPoints;
    }

    public isRanged(): boolean {
        return this.attackRange > 1;
    }

    public applyDamage(damage: number, attacker?: Character): void {
        this.hitPoints -= damage;

        this.damagedCallback?.(damage, attacker);
    }

    public isDead(): boolean {
        return this.hitPoints < 1 || this.dead;
    }

    public getCombat(): Combat {
        return this.combat;
    }

    public getHitPoints(): number {
        return this.hitPoints;
    }

    public getMaxHitPoints(): number {
        return this.maxHitPoints;
    }

    public override setPosition(x: number, y: number): void {
        this.previousX = this.x;
        this.previousY = this.y;

        super.setPosition(x, y);

        this.movementCallback?.(x, y);
    }

    public setTarget(target: Character | null): void {
        this.target = target;

        this.targetCallback?.(target);
    }

    private setPotentialTarget(potentialTarget: unknown): void {
        this.potentialTarget = potentialTarget;
    }

    public setHitPoints(hitPoints: number): void {
        this.hitPoints = hitPoints;

        this.hitPointsCallback?.();
    }

    public setPoison(poison: string): void {
        this.poison = poison;

        this.poisonCallback?.(poison);
    }

    public getProjectile(): Modules.Projectiles {
        return this.projectile;
    }

    public getProjectileName(): string {
        return this.projectileName;
    }

    public getWeaponLevel(): number {
        return this.weaponLevel;
    }

    public getArmourLevel(): number {
        return this.armourLevel;
    }

    public override getState(): CharacterState {
        let state = super.getState() as CharacterState;

        state.movementSpeed = this.movementSpeed;

        return state;
    }

    protected hasMaxHitPoints(): boolean {
        return this.hitPoints >= this.maxHitPoints;
    }

    public removeTarget(): void {
        this.removeTargetCallback?.();

        this.clearTarget();
    }

    private hasPotentialTarget(potentialTarget: unknown): boolean {
        return this.potentialTarget === potentialTarget;
    }

    public clearTarget(): void {
        this.target = null;
    }

    public onTarget(callback: TargetCallback): void {
        this.targetCallback = callback;
    }

    public onRemoveTarget(callback: () => void): void {
        this.removeTargetCallback = callback;
    }

    public onMovement(callback: MovementCallback): void {
        this.movementCallback = callback;
    }

    public onHit(callback: HitCallback): void {
        this.hitCallback = callback;
    }

    public onHealthChange(callback: () => void): void {
        this.healthChangeCallback = callback;
    }

    public onDamage(callback: DamageCallback): void {
        this.damageCallback = callback;
    }

    /** When the entity gets hit. */
    public onDamaged(callback: DamagedCallback): void {
        this.damagedCallback = callback;
    }

    public onStunned(callback: StunCallback): void {
        this.stunCallback = callback;
    }

    public onSubAoE(callback: SubAoECallback): void {
        this.subAoECallback = callback;
    }

    public onPoison(callback: PoisonCallback): void {
        this.poisonCallback = callback;
    }

    public onDeath(callback: () => void): void {
        this.deathCallback = callback;
    }

    public onReturn(callback: () => void): void {
        this.returnCallback = callback;
    }
}
