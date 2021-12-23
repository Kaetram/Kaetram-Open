import { Modules } from '@kaetram/common/network';

import Entity, { EntityData } from '../entity';
import Combat from './combat/combat';

import type { HitData } from '@kaetram/common/types/info';
import type Boots from './player/equipment/boots';
import type Pendant from './player/equipment/pendant';
import type Ring from './player/equipment/ring';
import HitPoints from './points/hitpoints';

type DamageCallback = (target: Character, hitInfo: HitData) => void;
type StunCallback = (stun: boolean) => void;
type HitCallback = (attacker: Character, damage?: number) => void;
type DamagedCallback = (damage: number, attacker?: Character) => void;
type PoisonCallback = (poison: string) => void;
type SubAoECallback = (radius: number, hasTerror: boolean) => void;

export default abstract class Character extends Entity {
    public level = 1;

    public movementSpeed = Modules.Defaults.MOVEMENT_SPEED;
    public attackRange = 1;
    public attackRate = Modules.Defaults.ATTACK_RATE;
    public healingRate = Modules.Constants.HEAL_RATE;

    public hitPoints = new HitPoints(Modules.Defaults.HITPOINTS);

    /* States */
    public poison: string | null = null;

    public target: Character | null = null;

    public stunTimeout: NodeJS.Timeout | null = null;

    public projectile = Modules.Projectiles.Arrow;
    public projectileName = 'projectile-pinearrow';

    private healingInterval: NodeJS.Timeout | null = null;

    public weaponLevel!: number;
    public armourLevel!: number;
    public stunned = false;

    private stunCallback?: StunCallback;
    public hitCallback?: HitCallback;
    private damagedCallback?: DamagedCallback;
    private poisonCallback?: PoisonCallback;
    public damageCallback?: DamageCallback;
    public subAoECallback?: SubAoECallback;
    public deathCallback?(): void;

    public moving = false;
    public lastMovement!: number;

    public pvp = false;

    public frozen = false;

    public alwaysAggressive = false;

    public invincible = false;
    public lastAttacker!: Character | null;

    public pendant!: Pendant;
    public ring!: Ring;
    public boots!: Boots;

    protected constructor(instance: string, key: string, x: number, y: number) {
        super(instance, key, x, y);

        this.combat = new Combat(this);

        this.healingInterval = setInterval(this.heal.bind(this), Modules.Constants.HEAL_RATE);
    }

    public heal(amount = 1): void {
        if (this.dead) return;
        if (this.combat.started) return;
        if (this.poison) return;

        this.hitPoints.increment(amount);
    }

    public stopHealing(): void {
        clearInterval(this.healingInterval!);
        this.healingInterval = null;
    }

    public setStun(stun: boolean): void {
        this.stunned = stun;

        this.stunCallback?.(stun);
    }

    public hit(attacker: Character, damage: number): void {
        this.hitPoints.decrement(damage);

        this.hitCallback?.(attacker, damage);
    }

    public isRanged(): boolean {
        return this.attackRange > 1;
    }

    public isDead(): boolean {
        return this.hitPoints.isEmpty() || this.dead;
    }

    public getCombat(): Combat {
        return this.combat;
    }

    public getHitPoints(): number {
        return this.hitPoints.getHitPoints();
    }

    public getMaxHitPoints(): number {
        return this.hitPoints.getMaxHitPoints();
    }

    public override setPosition(x: number, y: number): void {
        super.setPosition(x, y);
    }

    public setTarget(target: Character | null): void {
        this.target = target;
    }

    public setHitPoints(hitPoints: number): void {
        this.hitPoints.setHitPoints(hitPoints);
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
        return 1;
        // return this.weaponLevel;
    }

    public getArmourLevel(): number {
        return 1;
        // return this.armourLevel;
    }

    public removeTarget(): void {
        this.clearTarget();
    }

    public clearTarget(): void {
        this.target = null;
    }

    public override serialize(): EntityData {
        let data = super.serialize();

        data.movementSpeed = this.movementSpeed;

        return data;
    }

    /**
     * Default value for an entity having special attack
     */

    protected hasSpecialAttack(): boolean {
        return false;
    }

    //???????????????????????????????????????????????????????

    public onHit(callback: HitCallback): void {
        this.hitCallback = callback;
    }

    public onDamage(callback: DamageCallback): void {
        this.damageCallback = callback;
    }

    /** When the entity gets hit. */
    public onDamaged(callback: DamagedCallback): void {
        this.damagedCallback = callback;
    }

    //???????????????????????????????????????????????????????

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
}
