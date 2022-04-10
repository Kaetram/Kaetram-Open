import Entity, { EntityData } from '../entity';
import Combat from './combat/combat';

import World from '../../world';
import Packet from '../../../network/packet';
import HitPoints from './points/hitpoints';

import { Modules, Opcodes } from '@kaetram/common/network';
import { Movement, Points } from '../../../network/packets';
import { PacketType } from '@kaetram/common/network/modules';

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

    // Character that is currently being targeted.
    public target?: Character | undefined;
    // List of entities attacking this character.
    public attackers: Character[] = []; // Used by combat to determine which character to target.

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
    public lastAttacker?: Character | undefined;

    public stunTimeout?: NodeJS.Timeout;
    private healingInterval?: NodeJS.Timeout;

    private stunCallback?: StunCallback;
    private poisonCallback?: PoisonCallback;

    public hitCallback?: HitCallback;
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
                instance: this.instance,
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

    /**
     * Sets the target to null (ending combat).
     */

    public clearTarget(): void {
        this.target = undefined;
    }

    /**
     * Clears the entire list of attackers.
     */

    public clearAttackers(): void {
        this.attackers = [];
    }

    /**
     * Removes an attacker specified from our list.
     * @param attacker The attacker character we are trying to remove.
     */

    public removeAttacker(attacker: Character): void {
        this.attackers = this.attackers.filter((a: Character) => a.instance !== attacker.instance);
    }

    /**
     * Sets the new target.
     * @param target Character object that we are targeting.
     */

    public setTarget(target: Character): void {
        this.target = target;
    }

    /**
     * Adds an attacker to our list of attackers.
     * @param attacker The attacker we are adding to the list.
     */

    public addAttacker(attacker: Character): void {
        this.attackers.push(attacker);
    }

    /**
     * Finds a character to target within the list of attackers.
     * @return A character object within the list of attackers.
     */

    public findNearestTarget(): Character {
        // Finds a Character within the list of attackers that is closest to the current character.
        return this.attackers.reduce((prev: Character, curr: Character) => {
            return prev.getDistance(this) < curr.getDistance(this) ? prev : curr;
        });
    }

    /**
     * Set `hitPoints` function shortcut.
     * @param hitPoints The new hitPoints we are setting.
     */

    public setHitPoints(hitPoints: number): void {
        this.hitPoints.setHitPoints(hitPoints);
    }

    /**
     * Sets the stun status and makes a callback.
     * @param stun The new stun status we are setting.
     */

    public setStun(stun: boolean): void {
        this.stunned = stun;

        this.stunCallback?.(stun);
    }

    /**
     * Sets the poison status and makes a callback.
     * @param poison The new poison status we are setting.
     */

    public setPoison(poison: string): void {
        this.poison = poison;

        this.poisonCallback?.(poison);
    }

    /**
     * Returns the type of projectile the character is using.
     * @returns A projectile integer from the enum of Projectiles.
     */

    public getProjectile(): Modules.Projectiles {
        return this.projectile;
    }

    /**
     * @returns Checks if the `target` is not null.
     */

    public hasTarget(): boolean {
        return !!this.target;
    }

    /**
     * Checks if an attacker exists within our list of attackers.
     * @param attacker The attacker we are checking the existence of.
     * @returns Boolean value of whether the attacker exists or not.
     */

    public hasAttacker(attacker: Character): boolean {
        return this.attackers.some((a: Character) => a.instance === attacker.instance);
    }

    /**
     * @returns If the `attackRange` is greater than 1.
     */

    public isRanged(): boolean {
        return this.attackRange > 1;
    }

    /**
     * Checks if an entity is dead by verifying
     * hitPoints are above 0 or if the variable `dead` is set.
     * @returns Boolean on whether the character is dead or not.
     */

    public isDead(): boolean {
        return this.hitPoints.isEmpty() || this.dead;
    }

    /**
     * Checks if the character is within its own attack
     * range next to its target.
     * @returns Boolean on whether the target character is in range or not.
     */

    public isNearTarget(): boolean {
        if (!this.target) return false;

        return this.getDistance(this.target) <= this.attackRange;
    }

    // Packet sending functions

    /**
     * Sends a packet to the current region.
     * @param packet The packet we are sending to the region.
     * @param ignore Optional parameter to ignore the current instance.
     */

    public sendToRegion(packet: Packet, ignore?: boolean): void {
        if (!this.isPlayer()) return;

        this.world.push(PacketType.Region, {
            region: this.region,
            packet,
            ignore: ignore ? this.instance : ''
        });
    }

    /**
     * Sends a packet to all regions surrounding the player.
     * @param packet The packet we are sending to the regions.
     * @param ignore Optional parameter to ignore the current instance.
     */

    public sendToRegions(packet: Packet, ignore?: boolean): void {
        if (!this.isPlayer()) return;

        this.world.push(PacketType.Regions, {
            region: this.region,
            packet,
            ignore: ignore ? this.instance : ''
        });
    }

    // End of packet sending functions

    /**
     * Takes the superclass' entity data and adds `movementSpeed`.
     * @returns EntityData but with movementSpeed added.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        data.movementSpeed = this.movementSpeed;

        return data;
    }

    // Superclass functions that require per-subclass implementation.

    /**
     * Unimplmented weapon level function for the superclass.
     * @returns Default weapon level of 1.
     */

    public getWeaponLevel(): number {
        return 1;
    }

    /**
     * Unimplmented armour level function for the superclass.
     * @returns Default armour level of 1.
     */

    public getArmourLevel(): number {
        return 1;
    }

    /**
     * Unimplemented special attack function for the superclass.
     * @returns Always false if not implemented.
     */

    public hasSpecialAttack(): boolean {
        return false;
    }

    /**
     * Callback for when the character is being hit.
     * @param callback Contains the damage and an optional parameter for attacker.
     */

    public onHit(callback: HitCallback): void {
        this.hitCallback = callback;
    }

    /**
     * Callback for when the stun status changes.
     * @param callback Contains the boolean value of the stun status.
     */

    public onStunned(callback: StunCallback): void {
        this.stunCallback = callback;
    }

    /**
     * Callback for when the poison status changes.
     * @param callback Contains the boolean value of the poison status.
     */

    public onPoison(callback: PoisonCallback): void {
        this.poisonCallback = callback;
    }

    /**
     * Callback for when the character dies.
     * @param callback Contains the attacker that killed the character if not undefined.
     */

    public onDeath(callback: (attacker?: Character) => void): void {
        this.deathCallback = callback;
    }
}
