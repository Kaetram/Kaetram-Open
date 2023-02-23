import Combat from './combat/combat';
import Hit from './combat/hit';
import HitPoints from './points/hitpoints';
import Poison from './poison';

import Entity from '../entity';
import { Combat as CombatPacket, Effect, Movement, Points } from '../../../network/packets';
import Formulas from '../../../info/formulas';

import Utils from '@kaetram/common/util/utils';
import { PacketType } from '@kaetram/common/network/modules';
import { Modules, Opcodes } from '@kaetram/common/network';

import type { EntityData } from '@kaetram/common/types/entity';
import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type Packet from '../../../network/packet';
import type World from '../../world';

type StunCallback = (stun: boolean) => void;
type PoisonCallback = (type: number, exists: boolean) => void;
type HitCallback = (damage: number, attacker?: Character) => void;
type DeathCallback = (attacker?: Character) => void;

export default abstract class Character extends Entity {
    public level = 1;
    public attackRange = 1;
    public plateauLevel = 0;

    public hitPoints: HitPoints;

    public healRate: number = Modules.Constants.HEAL_RATE;
    public movementSpeed: number = Modules.Defaults.MOVEMENT_SPEED;
    public attackRate: number = Modules.Defaults.ATTACK_RATE;
    public healingRate: number = Modules.Constants.HEAL_RATE;
    public orientation: number = Modules.Orientation.Down;
    public aoeType: number = Modules.AoEType.Character;

    /* States */
    public poison?: Poison | undefined;

    // Character that is currently being targeted.
    public target?: Character | undefined;

    // List of entities attacking this character.
    public attackers: Character[] = []; // Used by combat to determine which character to target.

    public damageTable: { [instance: string]: number } = {};

    public stunned = false;
    public moving = false;
    public pvp = false;
    public frozen = false;
    public invincible = false;
    public terror = false;
    public teleporting = false;
    public aoe = 0;

    public projectileName = 'projectile-arrow';

    public lastStep = -1;
    public lastMovement = -1;
    public lastRegionChange = -1;
    public lastAttacker?: Character | undefined;

    public stunTimeout?: NodeJS.Timeout | undefined;
    private healingInterval?: NodeJS.Timeout | undefined;
    private poisonInterval?: NodeJS.Timeout | undefined;

    private stunCallback?: StunCallback;
    private poisonCallback?: PoisonCallback;

    public hitCallback?: HitCallback;
    public deathCallback?: DeathCallback;
    public deathICallback?: DeathCallback;

    protected constructor(
        instance: string,
        public world: World,
        key: string,
        x: number,
        y: number
    ) {
        super(instance, key, x, y);

        this.combat = new Combat(this);

        this.hitPoints = new HitPoints(Formulas.getMaxHitPoints(this.level));

        this.onStunned(this.handleStun.bind(this));
        this.hitPoints.onHitPoints(this.handleHitPoints.bind(this));

        this.healingInterval = setInterval(this.heal.bind(this), this.healRate);
    }

    /**
     * Receives changes about the state of the entity when stunned and
     * pushes that message to the nearby regions.
     * @param state The current stun state for the character.
     */

    private handleStun(state: boolean): void {
        this.sendToRegions(new Effect(Opcodes.Effect.Stun, { instance: this.instance, state }));
    }

    /**
     * Handles a change in the hit points and relays
     * that information to the nearby regions.
     */

    private handleHitPoints(): void {
        // Sync the change in hitpoints to nearby entities.
        this.sendToRegions(
            new Points({
                instance: this.instance,
                hitPoints: this.hitPoints.getHitPoints(),
                maxHitPoints: this.hitPoints.getMaxHitPoints()
            })
        );
    }

    /**
     * Function when we want to apply damage to the character.
     * We check if the poison status has expired first, if it has
     * not, then we apply the poison damage.
     */

    private handlePoison(): void {
        if (!this.poison) return;

        // Remove the poison if it has expired.
        if (this.poison.expired()) return this.setPoison();

        // Create a hit object for poison damage and serialize it.
        let hit = new Hit(Modules.Hits.Poison, this.poison.damage).serialize();

        // Send a hit packet to display the info to the client.
        this.sendToRegions(
            new CombatPacket(Opcodes.Combat.Hit, {
                instance: this.instance,
                target: this.instance,
                hit
            })
        );

        // Do the actual damage to the character.
        this.hit(this.poison.damage);
    }

    /**
     * Handles the damage of an AoE attack. We iterate through all the nearby entities
     * within the character's AoE type and range, then apply damage proportional
     * to the distance from the character. The farther away, the lesser the damage.
     * @param damage The initial damage performed by the attack.
     * @param attacker Who is performing the initial attack.
     * @param range The AoE range of the attack.
     */

    private handleAoE(damage: number, attacker?: Character, range = 1): void {
        this.forEachNearbyCharacter((character: Character) => {
            // Ignore mob-on-mob AoE damage.
            if (character.isMob() && this.isMob()) return;

            // Ignore player-on-player AoE damage unless PvP is enabled.
            if (character.isPlayer() && this.isPlayer() && !this.pvp && !character.pvp) return;

            let distance = this.getDistance(character) + 1,
                hit = new Hit(
                    Modules.Hits.Damage,
                    Math.floor(damage / distance),
                    false,
                    distance
                ).serialize();

            // Create a hit packet and send it to the nearby regions.
            this.sendToRegions(
                new CombatPacket(Opcodes.Combat.Hit, {
                    instance: attacker?.instance || '',
                    target: character.instance,
                    hit
                })
            );

            // Apply the damage to the character.
            character.hit(hit.damage, attacker);
        }, range);
    }

    /**
     * Cold damage occurs when the player is in a mountainous area. This effect
     * persists for as long as the player doesn't have the appropriate gear, or
     * a snow potion.
     */

    public handleColdDamage(): void {
        // Only players that are in a damage-based overlay area can be affected.
        if (!this.isPlayer() || this.overlayArea?.type !== 'damage' || this.snowPotion) return;

        // Create a hit object for cold damage and serialize it.
        let hit = new Hit(Modules.Hits.Cold, Modules.Constants.COLD_EFFECT_DAMAGE).serialize();

        // Send a hit packet to display the info to the client.
        this.sendToRegions(
            new CombatPacket(Opcodes.Combat.Hit, {
                instance: this.instance,
                target: this.instance,
                hit
            })
        );

        // Do the actual damage to the character.
        this.hit(Modules.Constants.COLD_EFFECT_DAMAGE);
    }

    /**
     * Handles the logic for when an attacker is trying to poison
     * the current character instance.
     */

    private handlePoisonDamage(attacker: Character): void {
        // Poison is related to the strength or archery level.
        let isPoisoned =
            Formulas.getPoisonChance(this.getSkillDamageLevel()) < attacker.getPoisonChance();

        // Use venom as default for now.
        if (isPoisoned) this.setPoison(Modules.PoisonTypes.Venom);
    }

    /**
     * Increments the hitpoints by the amount specified or 1 by default.
     * @param amount Healing amount, defaults to 1 if not specified.
     */

    public heal(amount = 1): void {
        // Cannot heal if dead or poisoned.
        if (this.isDead() || this.poison) return;

        // Cannot heal if engaged in combat.
        if (this.combat.started) return;

        // Cannot heal if character is being attacked.
        if (this.getAttackerCount() > 0) return;

        // Stops the character from healing if they are at max hitpoints.
        if (this.hitPoints.isFull()) return;

        this.hitPoints.increment(amount);
    }

    /**
     * Superclass empty method.
     * @param x New x position.
     * @param y New y position.
     */

    public move(x: number, y: number): void {
        this.setPosition(x, y);
    }

    /**
     * When a character is on the same tile as another character and they are in a combat,
     * we use this function to move them near the other character.
     */

    public findAdjacentTile(): void {
        if (!this.world.map.isColliding(this.x + 1, this.y)) this.move(this.x + 1, this.y);
        else if (!this.world.map.isColliding(this.x - 1, this.y)) this.move(this.x - 1, this.y);
        else if (!this.world.map.isColliding(this.x, this.y + 1)) this.move(this.x, this.y + 1);
        else if (!this.world.map.isColliding(this.x, this.y - 1)) this.move(this.x, this.y - 1);
    }

    /**
     * Cleans the healing interval to clear the memory.
     */

    public stopHealing(): void {
        clearInterval(this.healingInterval);
    }

    /**
     * Takes damage from an attacker character and creates a callback.
     * The `combat.stop()` occurs here since the character can be
     * either a mob or a player, so it must stop whenever any target is
     * dead.
     * @param attacker The attacker dealing the damage.
     * @param damage The amount of damage being dealt.
     * @param aoe Whether or not the damage is AoE based.
     */

    public hit(damage: number, attacker?: Character, aoe = 0): void {
        // Stop hitting if entity is dead.
        if (this.isDead() || this.invincible) return;

        // Add an entry to the damage table.
        if (attacker?.isPlayer()) this.addToDamageTable(attacker, damage);

        // Decrement health by the damage amount.
        this.hitPoints.decrement(damage);

        // If this is an AoE attack, we will damage all nearby characters.
        if (aoe) this.handleAoE(damage, attacker, aoe);

        // Hit callback on each hit.
        this.hitCallback?.(damage, attacker);

        // Call the death callback if the character reaches 0 hitpoints.
        if (this.isDead()) return this.deathCallback?.(attacker);

        // Poison only occurs when we land a hit and attacker has a poisonous weapon.
        if (attacker?.isPoisonous() && damage > 0) this.handlePoisonDamage(attacker);
    }

    /**
     * Makes a character follow another character. If the target parameter is specified
     * it will follow that character, otherwise it will use the current target. The packet
     * is sent to nearby regions.
     * @param target Optional parameter for which target to follow.
     */

    public follow(target?: Character): void {
        if (!target && !this.hasTarget()) return;

        this.sendToRegions(
            new Movement(Opcodes.Movement.Follow, {
                instance: this.instance,
                target: target?.instance || this.target!.instance
            })
        );
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
     * @returns Returns the number of attackers currently targeting this character.
     */

    public getAttackerCount(): number {
        return this.attackers.length;
    }

    /**
     * @returns The attack rate (speed) of the character when in combat.
     */

    public getAttackRate(): number {
        return this.attackRate;
    }

    /**
     * Superclass implementation for attack stats. These are just placeholder
     * values and are replaced when the subclass implements them.
     * @returns Placeholder default values for stats.
     */

    public getAttackStats(): Stats {
        return Utils.getEmptyStats();
    }

    /**
     * Superclass implementation for defense stats.
     * @returns Placeholder empty stats (similar to attack stats).
     */

    public getDefenseStats(): Stats {
        return Utils.getEmptyStats();
    }

    /**
     * Superclass implementation for bonsuses. Subclasses will change these accordingly.
     * @returns Empty placeholder values for bonuses.
     */

    public getBonuses(): Bonuses {
        return Utils.getEmptyBonuses();
    }

    /**
     * Default implementation for the character's accuracy level.
     * @returns Placeholder value for accuracy of 1.
     */

    public getAccuracyLevel(): number {
        return 1;
    }

    /**
     * Default implementation for the character's strength level (used for combat damage calculation).
     * @returns Placeholder value for strength of 1.
     */

    public getStrengthLevel(): number {
        return 1;
    }

    /**
     * Default implementation for the character's archery level (used for combat damage calculation).
     * @returns The character's current arhcery level.
     */

    public getArcheryLevel(): number {
        return 1;
    }

    /**
     * @returns The character's current defense level.
     */

    public getDefenseLevel(): number {
        return 1;
    }

    /**
     * Picks the bonus from the total bonuses as either archery bonus or strength bonus
     * depending on whether the character is using a ranged weapon or not.
     * @returns The bonus value for either archery or strength.
     */

    public getDamageBonus(): number {
        return this.isRanged() ? this.getBonuses().archery : this.getBonuses().strength;
    }

    /**
     * This function is to condense the amount of code needed to obtain whether the
     * strength level or the archery level. Instead we just check if the character is
     * ranged based and choose the appropriate skill leve (strength or archery).
     * @returns The level of the skill that is being used for combat.
     */

    public getSkillDamageLevel(): number {
        return this.isRanged() ? this.getArcheryLevel() : this.getStrengthLevel();
    }

    /**
     * This value is used by subclasses to determine the amount of damage a
     * character will absorb during the combat damage calculation.
     * @returns A placeholder value of 1. The value is between 0 and 1.
     */

    public getDamageReduction(): number {
        return 1;
    }

    /**
     * Default implementation for the character's attack style. This is used
     * by the player subclass when the player changes their attack style.
     * @returns The attack style of the character.
     */

    public getAttackStyle(): Modules.AttackStyle {
        return Modules.AttackStyle.None;
    }

    /**
     * @returns Default probability for poison to be inflicted.
     */

    public getPoisonChance(): number {
        return Modules.Defaults.POISON_CHANCE;
    }

    /**
     * AoE damage works on a toggle basis. When a character uses an AoE attack
     * it automatically resets the ability to use AoE attacks until it is toggled
     * again. Toggling refers to the AoE radius value being set to anything greater
     * than 0.
     * @returns The current AoE radius value.
     */

    public getAoE(): number {
        let aoeVal = this.aoe;

        if (this.aoe) this.aoe = 0;

        return aoeVal;
    }

    /**
     * @returns Returns the projectile sprite name for the character.
     */

    public getProjectileName(): string {
        return this.projectileName;
    }

    /**
     * Unimplemented special attack function for the superclass.
     * @returns Always false if not implemented.
     */

    public hasSpecialAttack(): boolean {
        return false;
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
     * Defaults implementation for characters.
     * @returns Always false if not implemented.
     */

    public hasArrows(): boolean {
        return true;
    }

    /**
     * A character is considered in combat when they have a target or are
     * being targeted by some attackers.
     * @returns Whether or not the character is in a combat.
     */

    public inCombat(): boolean {
        return (
            this.combat.started ||
            this.attackers.length > 0 ||
            this.hasTarget() ||
            !this.combat.expired()
        );
    }

    /**
     * `isRanged` is a general function that checks if the character is using
     * any form of ranged attack. This can be either a bow or magic spells. It is
     * up to the rest of the logic to establish which is which and what to do.
     * @returns If the `attackRange` is greater than 1.
     */

    public isRanged(): boolean {
        return this.attackRange > 1;
    }

    /**
     * @returns Default implementation for characters.
     */

    public isMagic(): boolean {
        return false;
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
     * Checks if the character is within its own attack range next to its target.
     * @returns Boolean on whether the target character is in range or not.
     */

    public isNearTarget(): boolean {
        /**
         * A target can only be attacked through range if it's on the same plateau level or
         * a lower one. This prevents players from sniping mobs on higher levels.
         */
        if (this.isRanged())
            return (
                this.getDistance(this.target!) <= this.attackRange &&
                this.plateauLevel >= this.target!.plateauLevel
            );

        return this.isAdjacent(this.target!);
    }

    /**
     * Superclass implementation for poisonous damage. Mobs have this
     * enabled if they're poisonous, players have this enabled if
     * they carry a weapon that's imbued with poison.
     * @returns Defaults to false.
     */

    public isPoisonous(): boolean {
        return false;
    }

    /**
     * Checks if the character's target is on the same tile as the character.
     * @returns If the distance between the character and the target is 0.
     */

    public isOnSameTile(): boolean {
        return this.getDistance(this.target!) === 0;
    }

    /**
     * Used for validating the attack request from the client. The primary purpose is to validate
     * or restrict attacking actions depending on certain contexts. If we're attacking a mob then
     * all is good. If we're dealing with attacking mobs in the tutorial, we need to ensure that
     * we are allowed to do so. If we're attacking another player, we must check the conditionals
     * for the PvP status and prevent cheaters from attacking/being attacked by other players.
     * @param target The target character instance that we are attempting to attack.
     */

    protected canAttack(target: Character): boolean {
        if (target.isMob()) {
            // Restrict the mobs in tutorial from being attacked by the player.
            if (this.isPlayer() && !this.quests.canAttackInTutorial()) {
                this.notify('You have no reason to attack these creatures.');
                return false;
            }

            return true;
        }

        // If either of the entities are not players, we don't want to handle this.
        if (!this.isPlayer() || !target.isPlayer()) return false;

        // Prevent cheaters from being targeted by other players.
        if (target.isCheater()) {
            this.notify(`That player is a cheater, you don't wanna attack someone like that!`);

            return false;
        }

        // Prevent cheaters from starting a fight with other players.
        if (this.isCheater()) {
            this.notify(
                `Sorry but cheaters can't attack other players, that wouldn't be fair to them!`
            );

            return false;
        }

        // Use minigame logic to determine if the players can attack each other.
        if (this.inMinigame() && target.inMinigame()) return this.team !== target.team;

        // Prevent attacking in non-pvp areas.
        if (!this.pvp && !target.pvp) return false;

        // Prevent attacking when level difference is too great.
        if (Math.abs(this.level - target.level) > 30) {
            this.notify('You cannot attack someone more than 30 levels above or below you.');
            return false;
        }

        return true;
    }

    /**
     * Override of the superclass `setPosition`. Since characters are the only
     * instances capable of movement, we need to update their position in the grids.
     * @param x The new x grid position.
     * @param y The new y grid position.
     */

    public override setPosition(x: number, y: number): void {
        super.setPosition(x, y);

        // Updates the character's position in the grid.
        this.world.map.grids.updateEntity(this);
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
     * Adds or creates an entry in the damage table for the attacker.
     * @param attacker The attacker we are adding to the damage table.
     * @param damage The damage we are adding to the damage table.
     */

    public addToDamageTable(attacker: Character, damage: number): void {
        // Max out the damage to the remaining hit points.
        if (damage >= this.hitPoints.getHitPoints()) damage = this.hitPoints.getHitPoints();

        // Add a new entry to the damage table if it doesn't exist.
        if (!(attacker.instance in this.damageTable)) this.damageTable[attacker.instance] = damage;

        // Otherwise, add the damage to the existing entry.
        this.damageTable[attacker.instance] += damage;
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
     * Sets the poison status and makes a callback. If
     * no type is specified, we remove the poison.
     * @param type The type of poison we are adding.
     * @param start Optional paramater for setting when poision starts (for loading from database).
     */

    public setPoison(type = -1, start?: number): void {
        let remove = type === -1;

        // No need to remove a non-existant status.
        if (remove && !this.poison) return;

        // Used to prevent poison status stacking.
        let exists = type !== -1 && !!this.poison;

        // Set or remove the poison status.
        this.poison = remove ? undefined : new Poison(type, start);

        // Remove the poison status or create an interval for the poison.
        if (remove) {
            clearInterval(this.poisonInterval);
            this.poisonInterval = undefined;
        } else if (!exists)
            this.poisonInterval = setInterval(this.handlePoison.bind(this), this.poison?.rate);

        this.poisonCallback?.(type, !exists);
    }

    /**
     * Updates the current orientation of the character.
     * @param orientation New orientation value for the character.
     */

    public setOrientation(orientation: Modules.Orientation): void {
        this.orientation = orientation;
    }

    // Packet sending functions

    /**
     * Sends a packet to the current region.
     * @param packet The packet we are sending to the region.
     * @param ignore Optional parameter to ignore the current instance.
     */

    public sendToRegion(packet: Packet, ignore?: boolean): void {
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
        this.world.push(PacketType.Regions, {
            region: this.region,
            packet,
            ignore: ignore ? this.instance : ''
        });
    }

    /**
     * Broadcasts a message to all the players in the world.
     * @param packet The packet to send globally.
     */

    public sendBroadcast(packet: Packet): void {
        this.world.push(PacketType.Broadcast, {
            packet
        });
    }

    // End of packet sending functions

    /**
     * Iterates through all the entities nearby and returns the ones within range. The condition for
     * entity filtering is based on the type of AoE damage the character is producing. This varies
     * depending on the instance. Players will deal damage to all characters if within a PvP area,
     * otherwise the default is to only deal damage to mobs. But mobs will only deal damage to players.
     * @param callback A character object.
     * @param range The range of the AoE damage.
     */

    public forEachNearbyCharacter(callback: (character: Character) => void, range = 1): void {
        this.world.getGrids().forEachEntityNear(
            this.x,
            this.y,
            (entity: Entity) => {
                // Igmnores the current character.
                if (entity.instance === this.instance) return;

                if (
                    this.aoeType === Modules.AoEType.Player
                        ? entity.isPlayer()
                        : this.aoeType === Modules.AoEType.Mob
                        ? entity.isMob()
                        : entity.isMob() || entity.isPlayer()
                )
                    callback(entity as Character);
            },
            range
        );
    }

    /**
     * Takes the superclass' entity data and adds `movementSpeed`.
     * @returns EntityData but with movementSpeed added.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        data.movementSpeed = this.movementSpeed;
        data.orientation = this.orientation;

        return data;
    }

    /**
     * Callback for when the stun status changes.
     * @param callback Contains the boolean value of the stun status.
     */

    public onStunned(callback: StunCallback): void {
        this.stunCallback = callback;
    }

    /**
     * Callback for when the status of the poison changes.
     * @param callback Contains information about the poison.
     */

    public onPoison(callback: PoisonCallback): void {
        this.poisonCallback = callback;
    }

    /**
     * Callback for when the character is being hit.
     * @param callback Contains the damage and an optional parameter for attacker.
     */

    public onHit(callback: HitCallback): void {
        this.hitCallback = callback;
    }

    /**
     * Callback for when the character dies.
     * @param callback Contains the attacker that killed the character if not undefined.
     */

    public onDeath(callback: DeathCallback): void {
        this.deathCallback = callback;
    }

    /**
     * A secondary callback for when the character dies. Generally used for instances
     * where we cannot write a plugin for the mob itself, and we only want to manipulate
     * the effects of the death without impeding the actual death callback.
     * @param callback Contains an optional parameter for the attacker.
     */

    public onDeathImpl(callback: DeathCallback): void {
        this.deathICallback = callback;
    }
}
