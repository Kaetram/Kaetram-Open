import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type { Stats } from '@kaetram/common/types/item';
import type Character from '../game/entity/character/character';

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
            accuracyModifier = this.getAccuracyWeight(attacker, target),
            defenseLevel = target.getDefenseLevel(),
            maxDamage = this.getMaxDamage(attacker, critical),
            accuracy: number = Modules.Constants.MAX_ACCURACY;

        /**
         * The damage output is calculated by taking the attacker's maximum damage output
         * and comparing against the accuracy calculated relative to the target's stats,
         * defense level, as well as the attacker's accuracy level, bonus, and stats.
         * We use four modifiers to output the final damage, and a weighted randomInt
         * distribution (think graphs skewed to the right or left depending on the accuracy).
         * The maximum damage takes in consideration tha player's strength level, their
         * weapon bonuses, (or their magic/archery if that's what they're using).
         *
         * The accuracy works backwards, 0.45 being the most accurate, and any number heigher
         * skews the graph towards the lower-end (higher likelihood of hitting lower damage).
         *
         * The accuracy consists of four parts, the accuracy bonus, the accuracy level,
         * the defense level of the target, and the accuracy modifier.
         *
         * The accuracy bonus is the bonus given by the attacker's equipment. We picked a maximum
         * of 55 since that is currently the maximum acquirable bonus from equipments the best
         * equipments. It's a linear scaling from 0-1, with highest bonus giving us the highest
         * accuracy. Note that this is subject to changes in the nearby future, and we do not
         * intend to keep it entirely linear.
         *
         * The next is the linear scaling of the accuracy level against the maximum level. The
         * higher your accuracy level, the higher the accuracy. This modifier has an absolute lowest
         * value of 0.01 (most accurate at maximum level) and highest value of 1.35
         * (lowest accuracy at level 1 accuracy).
         *
         * The next is a linear scale of the target's defense level. The higher their defense level the
         * more it will affect our accuracy. The way this was calculated was by considering the maximum
         * level a player will be able to reach (135). If we attack a player with maximum defense, our
         * accuracy will be throttled by 1.015. If we attack a player with level 1 defense, our accuracy
         * will be affected by 0.0075 (giving us more accuracy).
         *
         * Lastly this is the accuracy modifier of the attack stats. The attack stats are compared against
         * the target's defense stats and take into considering the primary attack style of the attacker
         * versus the primary defense style. For example, if we use slash against a target with a high defense
         * in slash, then our accuracy is lower than if we use slash against a target with a low defense in slash.
         * In order to minimize the accuracy of an attacker, your defense style must be the attacker's attack style.
         * If our attack stats are negative due to the target's extremely high defense stats, we append a 1.5
         * reduction in accuracy by default.
         *
         * All of these modifiers added together determine how much we stray away from the highest accuracy - 0.45.
         */

        // Linearly increase accuracy based on accuracy bonus, prevent from going over 50.
        accuracy += accuracyBonus > 50 ? 0.01 : 1 - accuracyBonus / 55;

        // Append the accuracy level bonus, we use a 1.75 modifier since skill level matters more.
        accuracy += (Modules.Constants.MAX_LEVEL - accuracyLevel + 1) * 0.01;

        // Append the defense level of the target to the accuracy modifier.
        accuracy += defenseLevel * 0.0075;

        // We use the scalar difference of the stats to append onto the accuracy.
        accuracy += accuracyModifier < 0 ? 1.5 : -(Math.sqrt(accuracyModifier) / 22.36) + 1;

        // Critical damage boosts accuracy by a factor of 0.05;
        if (critical) accuracy -= 0.05;

        // Apply the attack style modifiers.
        switch (attacker.getAttackStyle()) {
            case Modules.AttackStyle.Fast:
            case Modules.AttackStyle.LongRange: {
                // Rapid attack style decreases accuracy by a factor of 0.05;
                accuracy += 0.07;
                break;
            }

            case Modules.AttackStyle.Stab: {
                // Rapid attack style increases accuracy by a factor of 0.05;
                accuracy -= 0.07;
                break;
            }

            case Modules.AttackStyle.Crush:
            case Modules.AttackStyle.Chop: {
                // Rapid attack style increases accuracy by a factor of 0.04
                accuracy -= 0.04;
                break;
            }

            case Modules.AttackStyle.Shared: {
                // Shared attack style increases accuracy by a factor of 0.03
                accuracy -= 0.03;
                break;
            }
        }

        // We apply the damage absoprtion onto the max damage. See `getDamageReduction` for more information.
        maxDamage *= target.getDamageReduction();

        // We use the weighted randomInt distribution to determine the damage.
        let randomDamage = Utils.randomWeightedInt(0, maxDamage, accuracy);

        // Limit the damage to the target's remaining health.
        if (randomDamage > target.hitPoints.getHitPoints())
            randomDamage = target.hitPoints.getHitPoints();

        return randomDamage;
    },

    /**
     * Calculates the maximum damage attainable by a character given their strength (or archery) level,
     * their equipment bonuses, and any special active effects.
     * @param critical A critical hit boosts the damage multiplier by 1.5x;
     */

    getMaxDamage(character: Character, critical = false): number {
        let bonus = character.getDamageBonus(),
            level = character.getSkillDamageLevel(),
            damage = (bonus + level) * 1.25;

        // Apply the critical damage multiplier onto the damage.
        if (critical) damage *= 1.5;

        // Player characters get a boost of 5 damage.
        if (character.isPlayer()) damage += 5;

        // Different attack styles give different bonuses.
        switch (character.getAttackStyle()) {
            // Focused attack style boosts maximum damage by 10%
            case Modules.AttackStyle.Focused:
            case Modules.AttackStyle.Slash: {
                damage *= 1.1;
                break;
            }

            // Crush gives a 5% boost.
            case Modules.AttackStyle.Crush:
            case Modules.AttackStyle.Hack: {
                damage *= 1.05;
                break;
            }

            // Shared attack style gives a 3% boost.
            case Modules.AttackStyle.Shared: {
                damage *= 1.03;
                break;
            }
        }

        // Ensure the damage is not negative.
        if (damage < 0) damage = 0;

        return damage;
    },

    /**
     * Calculates the accuracy modifier for a character given their attack and defense stats.
     * The accuracy modifier is used to determine the likelihood of attaining maximum damage
     * in a hit. The higher the accuracy modifier, the less likely to attain maximum damage.
     * @param attacker The attacking character.
     * @param target The defending character.
     * @returns A float of the accuracy modifier (to be used for calculating likelihood of attaining max damage).
     */

    getAccuracyWeight(attacker: Character, target: Character): number {
        let attackerStats = attacker.getAttackStats(),
            targetStats = target.getDefenseStats(),
            attackStyle = this.getPrimaryStyle(attackerStats), // primary attack style of the attacker
            defenseStyle = this.getPrimaryStyle(targetStats), // primary defense style of the target
            weights: Stats = {
                crush: (attackerStats.crush - targetStats.crush) / 3,
                slash: (attackerStats.slash - targetStats.slash) / 3,
                stab: (attackerStats.stab - targetStats.stab) / 3,
                magic: (attackerStats.magic - targetStats.magic) / 3,
                archery: (attackerStats.archery - targetStats.archery) / 3
            },
            totalWeight =
                weights.crush + weights.slash + weights.stab + weights.magic + weights.archery;

        // Negative values add no weight to the accuracy modifier.
        if (weights.crush < 0) totalWeight -= weights.crush;
        if (weights.slash < 0) totalWeight -= weights.slash;
        if (weights.stab < 0) totalWeight -= weights.stab;
        if (weights.magic < 0) totalWeight -= weights.magic;
        if (weights.archery < 0) totalWeight -= weights.archery;

        // If our attack style is the same or none then we do not have any advantage in our accuracy.
        if (attackStyle === defenseStyle || attackStyle === Modules.DamageStyle.None)
            return totalWeight || 1;

        /**
         * If we have a attack style against a defense style that is not the same, then we can
         * remove the 1/5th of the weight and append the full weight of the attack style to the
         * accuracy modifier.
         */

        switch (attackStyle) {
            case Modules.DamageStyle.Crush: {
                totalWeight += weights.crush * 2;
                break;
            }

            case Modules.DamageStyle.Slash: {
                totalWeight += weights.slash * 2;
                break;
            }

            case Modules.DamageStyle.Stab: {
                totalWeight += weights.stab * 2;
                break;
            }

            case Modules.DamageStyle.Magic: {
                totalWeight += weights.magic * 2;
                break;
            }

            case Modules.DamageStyle.Archery: {
                totalWeight += weights.archery * 2;
                break;
            }
        }

        return totalWeight || 1;
    },

    /**
     * Compares every attack stat against every other attack stat and extracts which attack
     * stat is the greatest. This gives us tth primary attack style of the charater based
     * on their overall stats
     * @param stats The stats object to look through (either attack or defense).
     * @returns The primary style of attack.
     */

    getPrimaryStyle(stats: Stats): Modules.DamageStyle {
        return stats.crush > stats.slash && // If crush is greater than slash
            stats.crush > stats.stab && // and crush is greater than stab
            stats.crush > stats.magic && // and crush is greater than magic
            stats.crush > stats.archery // and crush is greater than archery
            ? Modules.DamageStyle.Crush // then return crush
            : stats.slash > stats.crush && // Else if slash is greater than crush
              stats.slash > stats.stab && // and slash is greater than stab
              stats.slash > stats.magic && // and slash is greater than magic
              stats.slash > stats.archery // and slash is greater than archery
            ? Modules.DamageStyle.Slash // then return slash
            : stats.stab > stats.crush && // Else if stab is greater than crush
              stats.stab > stats.slash && // and stab is greater than slash
              stats.stab > stats.magic && // and stab is greater than magic
              stats.stab > stats.archery // and stab is greater than archery
            ? Modules.DamageStyle.Stab // then return stab
            : stats.magic > stats.crush && // Else if magic is greater than crush
              stats.magic > stats.slash && // and magic is greater than slash
              stats.magic > stats.stab && // and magic is greater than stab
              stats.magic > stats.archery // and magic is greater than archery
            ? Modules.DamageStyle.Magic // then return magic
            : stats.archery > stats.crush && // Else if archery is greater than crush
              stats.archery > stats.slash && // and archery is greater than slash
              stats.archery > stats.stab && // and archery is greater than stab
              stats.archery > stats.magic // and archery is greater than magic
            ? Modules.DamageStyle.Archery // then return archery
            : Modules.DamageStyle.None; // Else return none
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

    nextExp(experience: number): number {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++)
            if (experience < this.LevelExp[i]) return this.LevelExp[i];

        return -1;
    },

    prevExp(experience: number): number {
        if (experience < 0) return 0;

        for (let i = Modules.Constants.MAX_LEVEL; i > 0; i--)
            if (experience >= this.LevelExp[i]) return this.LevelExp[i];

        return 0;
    },

    expToLevel(experience: number): number {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++) if (experience < this.LevelExp[i]) return i;

        return Modules.Constants.MAX_LEVEL;
    },

    /**
     * Calculates the experience required to go from one level to another.
     * @param startLevel The level we are starting from.
     * @param endLevel The level we are ending at.
     */

    levelsToExperience(startLevel: number, endLevel: number): number {
        return this.LevelExp[endLevel] - this.LevelExp[startLevel];
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
        return 20 + level * 24;
    },

    /**
     * Probability is calculated using the primary skill for dealing damage. For example
     * the player's strength if using a sword, or the archery if using a bow. 235 is picked
     * such that the maximum attainable poison chance is a random integer between 1 and 100.
     * With a poison chance of 10 as specified in Modules, the player has a minimum 6% chance
     * of poisoning another character, and a maximum of 15% when the respective skill is maxed.
     * @param level The level of the player.
     */

    getPoisonChance(level: number): number {
        // Chance is per 235 - level, each level increases the chance in poisioning.
        return Utils.randomInt(0, 235 - level);
    }
};
