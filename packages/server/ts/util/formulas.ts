/* global module */

import Utils from './utils';
import Constants from './constants';
import Trees from '../../data/professions/trees';
import Character from '../game/entity/character/character';

export default {
    LevelExp: [],

    // Chances of getting logs from a tree.
    getTreeChance(player: any, treeId: string) {
        let lumberjackingLevel = player.getLumberjackingLevel(),
            weaponLumberjackingLevel = player.getWeaponLumberjackingLevel(),
            treeLevel = Trees.Levels[treeId],
            probability = treeLevel * 10 - lumberjackingLevel * weaponLumberjackingLevel;

        if (probability < 2) probability = 2;

        return probability;
    },

    getDamage(attacker: Character, target: Character, special?: boolean) {
        let maxDamage = this.getMaxDamage(attacker, target, special),
            accuracy = Utils.randomInt(0, attacker.level);

        return Utils.randomInt(accuracy, maxDamage);
    },

    getMaxDamage(attacker: Character, target: Character, special?: boolean) {
        if (!attacker || !target) return;

        let damageDealt = 0,
            damageAbsorbed: number,
            damageAmplifier = 1,
            absorptionAmplifier = 1,
            weaponLevel = attacker.getWeaponLevel(),
            armourLevel = attacker.getArmourLevel(),
            pendant = attacker.pendant || null,
            ring = attacker.ring || null,
            boots = attacker.boots || null,
            targetArmour = target.getArmourLevel(),
            targetPendant = target.pendant || null,
            targetRing = target.ring || null,
            targetBoots = target.boots || null;

        if (attacker.type === 'player') damageDealt += 10;

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

        if (pendant && pendant.pendantLevel > 0) damageAmplifier *= pendant.getBaseAmplifier();

        if (ring && ring.ringLevel > 0) damageAmplifier *= ring.getBaseAmplifier();

        if (boots && boots.bootsLevel > 0) damageAmplifier *= boots.getBaseAmplifier();

        /**
         * Just so amplifiers don't get out of hand.
         */

        if (damageAmplifier > 1.6) damageAmplifier = 1.6;

        damageDealt *= damageAmplifier;

        damageAbsorbed = target.level + targetArmour / 2;

        if (targetPendant) absorptionAmplifier *= targetPendant.getBaseAmplifier();

        if (targetRing) absorptionAmplifier *= targetRing.getBaseAmplifier();

        if (targetBoots) absorptionAmplifier *= targetBoots.getBaseAmplifier();

        damageAbsorbed *= absorptionAmplifier;

        let damage = damageDealt - damageAbsorbed;

        damage = Math.ceil(damage);

        if (isNaN(damage) || !damage || damage < 0) damage = 0;

        return damage;
    },

    getCritical(attacker: any, target: Character) {
        if (!attacker || !target) return;

        /**
         * The critical is the player's max hit plus *= critical multiplier of the weapon
         */

        let damage = this.getDamage(attacker, target),
            multiplier = attacker.weapon.abilityLevel / 10;

        return (damage *= multiplier);
    },

    getWeaponBreak(attacker: Character, target: Character) {
        if (!attacker || !target) return;

        // let targetArmour: number = target.getArmourLevel();

        /**
         * The chance a weapon will break ....
         */

        let breakChance = Utils.randomRange(1, 100);

        return breakChance > 75;
    },

    getAoEDamage(attacker: Character, target: Character) {
        /**
         * Preliminary setup until this function is expanded
         * and fits in the necessary algorithms.
         */

        return this.getDamage(attacker, target);
    },

    nextExp(experience: number) {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++)
            if (experience < this.LevelExp[i]) return this.LevelExp[i];
    },

    prevExp(experience: number) {
        if (experience < 0) return -1;

        for (let i = Constants.MAX_LEVEL; i > 0; i--)
            if (experience > this.LevelExp[i]) return this.LevelExp[i];

        return 0;
    },

    expToLevel(experience: number) {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++) if (experience < this.LevelExp[i]) return i;

        return Constants.MAX_LEVEL;
    },

    getMaxHitPoints(level: number) {
        return 100 + level * 30;
    },

    getMaxMana(level: number) {
        return 10 + level * 8;
    }
};
