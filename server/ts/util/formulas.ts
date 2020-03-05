import Utils from './utils';
import Constants from './constants';

export default {
    LevelExp: [],

    getDamage(attacker, target, special?) {
        const maxDamage = this.getMaxDamage(attacker, target, special);
        const accuracy = Utils.randomInt(0, attacker.level);

        return Utils.randomInt(accuracy, maxDamage);
    },

    getMaxDamage(attacker, target, special?) {
        if (!attacker || !target) return;

        let damageDealt;
        let damageAbsorbed;
        let damageAmplifier = 1;
        let absorptionAmplifier = 1;
        const usingRange = attacker.weapon
            ? attacker.weapon.isRanged()
            : attacker.isRanged();
        const weaponLevel = attacker.weapon
            ? attacker.weapon.getLevel()
            : attacker.weaponLevel;
        const armourLevel = attacker.armour
            ? attacker.armour.getDefense()
            : attacker.armourLevel;
        const pendant = attacker.pendant ? attacker.pendant : null;
        const ring = attacker.ring ? attacker.ring : null;
        const boots = attacker.boots ? attacker.boots : null;
        const targetArmour = target.armour
            ? target.armour.getDefense()
            : target.armourLevel;
        const targetPendant = target.pendant ? target.pendant : null;
        const targetRing = target.ring ? target.ring : null;
        const targetBoots = target.boots ? target.boots : null;
        const isPlayer = attacker.type === 'player';

        damageDealt =
            (isPlayer ? 10 : 0) +
            attacker.level +
            (attacker.level * weaponLevel) / 4 +
            (attacker.level + weaponLevel * armourLevel) / 8;

        /**
         * Apply ranged damage deficit
         */

        if (usingRange) damageDealt /= 1.275;

        if (special) damageDealt *= 1.0575;

        /**
         * Apply special amulets
         */

        if (pendant && pendant.pendantLevel > 0)
            damageAmplifier *= pendant.getBaseAmplifier();

        if (ring && ring.ringLevel > 0)
            damageAmplifier *= ring.getBaseAmplifier();

        if (boots && boots.bootsLevel > 0)
            damageAmplifier *= boots.getBaseAmplifier();

        /**
         * Just so amplifiers don't get out of hand.
         */

        if (damageAmplifier > 1.6) damageAmplifier = 1.6;

        damageDealt *= damageAmplifier;

        damageAbsorbed = target.level + targetArmour / 2;

        if (targetPendant)
            absorptionAmplifier *= targetPendant.getBaseAmplifier();

        if (targetRing) absorptionAmplifier *= targetRing.getBaseAmplifier();

        if (targetBoots) absorptionAmplifier *= targetBoots.getBaseAmplifier();

        damageAbsorbed *= absorptionAmplifier;

        let damage = damageDealt - damageAbsorbed;

        damage = Math.ceil(damage);

        if (isNaN(damage) || !damage || damage < 0) damage = 0;

        return damage;
    },

    getCritical(attacker, target) {
        if (!attacker || !target) return;

        /**
         * The critical is the player's max hit plus *= critical multiplier of the weapon
         */

        let damage = this.getDamage(attacker, target);
        const multiplier = attacker.weapon.abilityLevel / 10;

        return (damage *= multiplier);
    },

    getWeaponBreak(attacker, target) {
        if (!attacker || !target) return;

        const targetArmour = target.getArmourLevel();

        /**
         * The chance a weapon will break ....
         */

        const breakChance = Utils.randomRange(1, 100);

        return breakChance > 75;
    },

    getAoEDamage(attacker, target) {
        /**
         * Preliminary setup until this function is expanded
         * and fits in the necessary algorithms.
         */

        return this.getDamage(attacker, target);
    },

    nextExp(experience) {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++)
            if (experience < this.LevelExp[i]) return this.LevelExp[i];
    },

    prevExp(experience) {
        if (experience < 0) return -1;

        for (let i = Constants.MAX_LEVEL; i > 0; i--)
            if (experience > this.LevelExp[i]) return this.LevelExp[i];
    },

    expToLevel(experience) {
        if (experience < 0) return -1;

        for (let i = 1; i < this.LevelExp.length; i++)
            if (experience < this.LevelExp[i]) return i;

        return Constants.MAX_LEVEL;
    },

    getRewardExperience(player) {
        if (!player) return;

        return (5 + player.level) * player.level;
    },

    getMaxHitPoints(level) {
        return 100 + level * 30;
    },

    getMaxMana(level) {
        return 10 + level * 8;
    }
};
