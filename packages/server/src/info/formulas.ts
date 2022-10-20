import Utils from '@kaetram/common/util/utils';

import { Modules } from '@kaetram/common/network';
import { Stats } from '@kaetram/common/types/item';

import type Character from '../game/entity/character/character';
import type Player from '../game/entity/character/player/player';

export default {
    LevelExp: [] as number[],

    /**
     * Damage is calculated by taking into consideration the attacker's accuracy
     * level and bonus. We then use the `randomWeightedInt` to create a weighted distribution
     * for the likelihood of attaining maximum damage. The maximum attainable accuracy is
     * dictacted by the constant MAX_ACCURACY. The higher the accuracy value the less likely to achieve
     * maximum damage in a hit. We `add` onto the max accuracy such that
     * the higher the level the lower the addition. The higher the accuracy, the lower the chance
     * of hitting max damage.
     *
     * Max hit chance based on accuracy:
     * > 0.45 - 2.19%
     * > 0.90 - 0.94%
     * > 1.35 - 0.71%
     * > 2.50 -> 0.48%
     */

    getDamage(attacker: Character, target: Character, critical = false): number {
        let accuracyBonus = attacker.getBonuses().accuracy,
            accuracyLevel = attacker.getAccuracyLevel(),
            stats = this.getStatsDifference(attacker.getAttackStats(), target.getDefenseStats()),
            maxDamage = this.getMaxDamage(attacker, critical),
            accuracy: number = Modules.Constants.MAX_ACCURACY;

        /**
         * Take for example the following mock-up values used to calculate accuracy:
         * accuracyBonus = +13
         * accuracyLevel = 35
         * accuracy = 0.45 // MAX_ACCURACY
         *
         * accuracy += (1 / accuracyBonus) * 0.8
         * If the maximum attainable bonus is 100, then accuracy is only disrupted by 0.008
         * otherwise if the player has 1 accuracy bonus (0 defaults to 1), then the formula
         * disrupts the accuracy by 0.8. A 0.45 accuracy has a chance of 2.45% of attaining
         * max damage, whereas an accuracy of 1.25 has merely a chance of 0.62%.
         *
         * The same principle applies to the accuracy level. The defense and offense stats
         * are used to calculate a discrepancy in a similar fashion. If the taget's defense
         * is overwhelmed by the attacker's attack, then the amount added to the accuracy
         * modifier is smaller.
         */

        // Append the accuracy bonus property and ensure the value is not 0.
        accuracy += (1 / (accuracyBonus === 0 ? 1 : accuracyBonus)) * 0.8;

        // Append the accuracy level bonus, we use a 1.75 modifier since skill level matters more.
        accuracy += (1 / accuracyLevel) * 1.25;

        // We use the scalar difference of the stats to append onto the accuracy.
        if (stats > 0) accuracy -= Math.pow(stats, 0.33) * 0.01;
        else accuracy += Math.pow(Math.abs(stats), 0.33) * 0.01;

        // Critical damage boosts accuracy by a factor of 0.05;
        if (critical) accuracy -= 0.05;

        return Utils.randomWeightedInt(0, maxDamage, accuracy);
    },

    /**
     * Calculates the maximum damage attainable by a character given their strength stats,
     * their weapon bonuses, and any special active effects.
     * @param critical A critical hit boosts the damage multiplier by 1.5x;
     */

    getMaxDamage(character: Character, critical = false): number {
        let strengthBonus = character.getBonuses().strength,
            strengthLevel = character.getStrengthLevel(),
            damage = (strengthBonus + strengthLevel) * 1.25;

        // Apply the critical damage multiplier onto the damage.
        if (critical) damage *= 1.5;

        // Player characters get a boost of 5 damage.
        if (character.isPlayer()) damage += 5;

        return damage;
    },

    /**
     * Calculates the total scalar difference between the attacker's stats and the target's.
     * We subtract the target's stats from that of the attacker's and then add all of their
     * values together.
     * @param attackerStats The stats of the entity doing the attacking.
     * @param targetStats The stats of the entity being attacked.
     * @returns Scalar value representing the total stat difference.
     */

    getStatsDifference(attackerStats: Stats, targetStats: Stats): number {
        let diff = {
            crush: attackerStats.crush - targetStats.crush,
            slash: attackerStats.slash - targetStats.slash,
            stab: attackerStats.stab - targetStats.stab
        };

        /**
         * We exclude magic from this calculation since it will be processed separately
         * whenever that feature is implemented.
         */

        return diff.crush + diff.slash + diff.stab;
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

    /**
     * Formula used to calcualte maximum hitpoints.
     * @param level The level of the health skill generally.
     * @returns The maximum hitpoints number value.
     */

    getMaxHitPoints(level: number): number {
        return 39 + level * 30;
    },

    /**
     * Obtains the max mana given a level specified.
     * @param level The level we are using to calculate max mana.
     * @returns The max mana number value.
     */

    getMaxMana(level: number): number {
        return 10 + level * 8;
    },

    /**
     * For now, the poison probability is calculated on a per-level basis.
     * In the future, we will be implementing status effects and poison resistance.
     * @param level The level of the player.
     */

    getPoisonChance(level: number): number {
        // Chance is per 100, and each level decreases the chance by level * 3 percent.
        return Utils.randomInt(0, 100 + level * 3);
    }
};
