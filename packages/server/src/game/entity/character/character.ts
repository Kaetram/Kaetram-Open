import Entity, { EntityData } from '../entity';
import Combat from './combat/combat';

import HitPoints from './points/hitpoints';
import World from '../../world';

import type { HitData } from '@kaetram/common/types/info';
import { Modules, Opcodes } from '@kaetram/common/network';
import { Movement, Points } from '../../../network/packets';

type DamageCallback = (target: Character, hitInfo: HitData) => void;
type StunCallback = (stun: boolean) => void;
type HitCallback = (damage: number, attacker?: Character) => void;
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
    public poison = '';

    public target: Character | null = null;

    public weaponLevel!: number;
    public armourLevel!: number;

    public stunned = false;
    public moving = false;
    public pvp = false;
    public frozen = false;
    public alwaysAggressive = false;
    public invincible = false;

    public projectile = Modules.Projectiles.Arrow;
    public projectileName = 'projectile-pinearrow';

    public lastMovement!: number;
    public lastAttacker!: Character | null;

    public stunTimeout?: NodeJS.Timeout;
    private healingInterval?: NodeJS.Timeout;

    private stunCallback?: StunCallback;
    public hitCallback?: HitCallback;
    private poisonCallback?: PoisonCallback;
    public damageCallback?: DamageCallback;
    public subAoECallback?: SubAoECallback;
    public deathCallback?(attacker?: Character): void;

    protected constructor(
        instance: string,
        public world: World,
        key: string,
        x: number,
        y: number
    ) {
        super(instance, key, x, y);

        this.combat = new Combat(this);

        this.onStunned(this.stun.bind(this));
        this.healingInterval = setInterval(this.heal.bind(this), Modules.Constants.HEAL_RATE);
    }

    /**
     * Receives changes about the state of the entity when stunned and
     * pushes that message to the nearby regions.
     * @param state The current stun state for the character.
     */

    private stun(state: boolean): void {
        this.world.push(Modules.PacketType.Regions, {
            region: this.region,
            packet: new Movement(Opcodes.Movement.Stunned, {
                id: this.instance,
                state
            })
        });
    }

    /**
     * Increments the hitpoints by the amount specified or 1 by default.
     * @param amount Healing amount, defaults to 1 if not specified.
     */

    public heal(amount = 1): void {
        if (this.dead || this.poison) return;
        if (this.combat.started) return;

        this.hitPoints.increment(amount);
    }

    /**
     * Cleans the healing interval to clear the memory.
     */

    public stopHealing(): void {
        clearInterval(this.healingInterval!);
    }

    /**
     * Sets the target to null (ending combat).
     */

    public removeTarget(): void {
        this.target = null;
    }

    /**
     * Takes damage from an attacker character and creates a callback.
     * @param attacker The attacker dealing the damage.
     * @param damage The amount of damage being dealt.
     */

    public hit(damage: number, attacker?: Character): void {
        this.hitPoints.decrement(damage);

        // Sync the change in hitpoints to nearby entities.
        this.world.push(Modules.PacketType.Regions, {
            region: this.region,
            packet: new Points({
                id: this.instance,
                hitPoints: this.hitPoints.getHitPoints()
            })
        });

        // Call the death callback if the character reaches 0 hitpoints.
        if (this.isDead()) return this.deathCallback?.(attacker);

        this.hitCallback?.(damage, attacker);
    }

    public setStun(stun: boolean): void {
        this.stunned = stun;

        this.stunCallback?.(stun);
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

    public getMaxHitPoints(): number {
        return this.hitPoints.getMaxHitPoints();
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

    public isRanged(): boolean {
        return this.attackRange > 1;
    }

    public isDead(): boolean {
        return this.hitPoints.isEmpty() || this.dead;
    }

    /**
     * Takes the superclass' entity data and adds `movementSpeed`.
     * @returns EntityData but with movementSpeed added.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        data.movementSpeed = this.movementSpeed;

        return data;
    }

    public hasTarget(): boolean {
        return !!this.target;
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

    public onDeath(callback: (attacker?: Character) => void): void {
        this.deathCallback = callback;
    }
}
