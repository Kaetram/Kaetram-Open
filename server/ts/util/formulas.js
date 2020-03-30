"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var constants_1 = require("./constants");
exports["default"] = {
    LevelExp: [],
    getDamage: function (attacker, target, special) {
        var maxDamage = this.getMaxDamage(attacker, target, special);
        var accuracy = utils_1["default"].randomInt(0, attacker.level);
        return utils_1["default"].randomInt(accuracy, maxDamage);
    },
    getMaxDamage: function (attacker, target, special) {
        if (!attacker || !target)
            return;
        var damageDealt;
        var damageAbsorbed;
        var damageAmplifier = 1;
        var absorptionAmplifier = 1;
        var usingRange = attacker.weapon
            ? attacker.weapon.isRanged()
            : attacker.isRanged();
        var weaponLevel = attacker.weapon
            ? attacker.weapon.getLevel()
            : attacker.weaponLevel;
        var armourLevel = attacker.armour
            ? attacker.armour.getDefense()
            : attacker.armourLevel;
        var pendant = attacker.pendant ? attacker.pendant : null;
        var ring = attacker.ring ? attacker.ring : null;
        var boots = attacker.boots ? attacker.boots : null;
        var targetArmour = target.armour
            ? target.armour.getDefense()
            : target.armourLevel;
        var targetPendant = target.pendant ? target.pendant : null;
        var targetRing = target.ring ? target.ring : null;
        var targetBoots = target.boots ? target.boots : null;
        var isPlayer = attacker.type === 'player';
        damageDealt =
            (isPlayer ? 10 : 0) +
                attacker.level +
                (attacker.level * weaponLevel) / 4 +
                (attacker.level + weaponLevel * armourLevel) / 8;
        /**
         * Apply ranged damage deficit
         */
        if (usingRange)
            damageDealt /= 1.275;
        if (special)
            damageDealt *= 1.0575;
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
        if (damageAmplifier > 1.6)
            damageAmplifier = 1.6;
        damageDealt *= damageAmplifier;
        damageAbsorbed = target.level + targetArmour / 2;
        if (targetPendant)
            absorptionAmplifier *= targetPendant.getBaseAmplifier();
        if (targetRing)
            absorptionAmplifier *= targetRing.getBaseAmplifier();
        if (targetBoots)
            absorptionAmplifier *= targetBoots.getBaseAmplifier();
        damageAbsorbed *= absorptionAmplifier;
        var damage = damageDealt - damageAbsorbed;
        damage = Math.ceil(damage);
        if (isNaN(damage) || !damage || damage < 0)
            damage = 0;
        return damage;
    },
    getCritical: function (attacker, target) {
        if (!attacker || !target)
            return;
        /**
         * The critical is the player's max hit plus *= critical multiplier of the weapon
         */
        var damage = this.getDamage(attacker, target);
        var multiplier = attacker.weapon.abilityLevel / 10;
        return (damage *= multiplier);
    },
    getWeaponBreak: function (attacker, target) {
        if (!attacker || !target)
            return;
        var targetArmour = target.getArmourLevel();
        /**
         * The chance a weapon will break ....
         */
        var breakChance = utils_1["default"].randomRange(1, 100);
        return breakChance > 75;
    },
    getAoEDamage: function (attacker, target) {
        /**
         * Preliminary setup until this function is expanded
         * and fits in the necessary algorithms.
         */
        return this.getDamage(attacker, target);
    },
    nextExp: function (experience) {
        if (experience < 0)
            return -1;
        for (var i = 1; i < this.LevelExp.length; i++)
            if (experience < this.LevelExp[i])
                return this.LevelExp[i];
    },
    prevExp: function (experience) {
        if (experience < 0)
            return -1;
        for (var i = constants_1["default"].MAX_LEVEL; i > 0; i--)
            if (experience > this.LevelExp[i])
                return this.LevelExp[i];
    },
    expToLevel: function (experience) {
        if (experience < 0)
            return -1;
        for (var i = 1; i < this.LevelExp.length; i++)
            if (experience < this.LevelExp[i])
                return i;
        return constants_1["default"].MAX_LEVEL;
    },
    getRewardExperience: function (player) {
        if (!player)
            return;
        return (5 + player.level) * player.level;
    },
    getMaxHitPoints: function (level) {
        return 100 + level * 30;
    },
    getMaxMana: function (level) {
        return 10 + level * 8;
    }
};
