import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type Character from '../game/entity/character/character';
import type Player from '../game/entity/character/player/player';

export default {
    LevelExp: [] as number[],

    /**
     * Damage is calculated on a random basis. We first calculate the maximum
     * attainable damage of the attacker against the target. We then use a random
     * accuracy metric picking a number between 0 and the attacker's level. Finally
     * we use that range between the accuracy and the max damage to determine damage output.
     * @param attacker The attacker hitting the target.
     * @param target The target taking the damage.
     * @param special Whether the attack has special damage associated with it.
     * @returns Integer value of the damage.
     */

    getDamage(attacker: Character, target: Character, special = false): number {
        let maxDamage = this.getMaxDamage(attacker, target, special)!,
            accuracy = Utils.randomInt(0, attacker.level);

        return Utils.randomInt(accuracy, maxDamage);
    },

    getMaxDamage(attacker: Character, target: Character, special = false): number | undefined {
        if (!attacker || !target) return;

        let damageDealt = 0,
            damageAbsorbed: number,
            damageAmplifier = 1,
            absorptionAmplifier = 1,
            weaponLevel = attacker.getWeaponLevel(),
            armourLevel = attacker.getArmourLevel(),
            targetArmour = target.getArmourLevel(),
            pendant,
            ring,
            boots,
            targetPendant,
            targetRing,
            targetBoots;

        if (attacker.isPlayer()) damageDealt += 10;

        // ({ pendant, ring, boots } = attacker as Player);

        // if (target.isPlayer())
        //     ({ pendant: targetPendant, ring: targetRing, boots: targetBoots } = target as Player);

        damageDealt +=
            attacker.level +
            (attacker.level * weaponLevel) / 4 +
            (attacker.level + weaponLevel * armourLevel) / 8;

        /**
         * Apply ranged damage deficit
         */

        if (attacker.isRanged()) damageDealt /= 1.275;

        if (special) damageDealt *= 1.0575;

        /**
         * Apply special amulets
         */

        // if (pendant && pendant.pendantLevel > 0) damageAmplifier *= pendant.getBaseAmplifier();

        // if (ring && ring.ringLevel > 0) damageAmplifier *= ring.getBaseAmplifier();

        // if (boots && boots.bootsLevel > 0) damageAmplifier *= boots.getBaseAmplifier();

        /**
         * Just so amplifiers don't get out of hand.
         */

        if (damageAmplifier > 1.6) damageAmplifier = 1.6;

        damageDealt *= damageAmplifier;

        damageAbsorbed = target.level + targetArmour / 2;

        // if (targetPendant) absorptionAmplifier *= targetPendant.getBaseAmplifier();

        // if (targetRing) absorptionAmplifier *= targetRing.getBaseAmplifier();

        // if (targetBoots) absorptionAmplifier *= targetBoots.getBaseAmplifier();

        damageAbsorbed *= absorptionAmplifier;

        let damage = damageDealt - damageAbsorbed;

        damage = Math.ceil(damage);

        if (isNaN(damage) || !damage || damage < 0) damage = 0;

        return damage;
    },

    getCritical(attacker: Player, target: Character): number | undefined {
        if (!attacker || !target) return;

        /**
         * The critical is the player's max hit plus *= critical multiplier of the weapon
         */

        let weapon = attacker.equipment.getWeapon(),
            damage = this.getDamage(attacker, target),
            multiplier = weapon.abilityLevel / 10;

        return (damage *= multiplier);
    },

    getWeaponBreak(attacker: Character, target: Character): boolean | undefined {
        if (!attacker || !target) return;

        // let targetArmour: number = target.getArmourLevel();

        /**
         * The chance a weapon will break ....
         */

        let breakChance = Utils.randomFloat(1, 100);

        return breakChance > 75;
    },

    getAoEDamage(attacker: Character, target: Character): number {
        /**
         * Preliminary setup until this function is expanded
         * and fits in the necessary algorithms.
         */

        return this.getDamage(attacker, target);
    },

    nextExp(experience: number): number {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++)
            if (experience < this.LevelExp[i]) return this.LevelExp[i];

        return -1;
    },

    prevExp(experience: number): number {
        if (experience < 0) return 0;

        for (let i = Modules.Constants.MAX_LEVEL as number; i > 0; i--)
            if (experience >= this.LevelExp[i]) return this.LevelExp[i];

        return 0;
    },

    expToLevel(experience: number): number {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++) if (experience < this.LevelExp[i]) return i;

        return Modules.Constants.MAX_LEVEL;
    },

    getMaxHitPoints(level: number): number {
        return 39 + level * 30;
    },

    getMaxMana(level: number): number {
        return 10 + level * 8;
    }
};
