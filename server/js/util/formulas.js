/* global module */

let Formulas = {},
    Utils = require('./utils'),
    Constants = require('./constants');

Formulas.LevelExp = [];

module.exports = Formulas;

Formulas.getDamage = (attacker, target, special) => {

    let maxDamage = Formulas.getMaxDamage(attacker, target, special),
        accuracy = Utils.randomInt(0, attacker.level);

    return Utils.randomInt(accuracy, maxDamage);
};

Formulas.getMaxDamage = (attacker, target, special) => {

    if (!attacker || !target)
        return;

    let damageDealt, damageAbsorbed, damageAmplifier = 1, absorptionAmplifier = 1,
        usingRange = attacker.weapon ? attacker.weapon.isRanged() : attacker.isRanged(),
        weaponLevel = attacker.weapon ? attacker.weapon.getLevel() : attacker.weaponLevel,
        armourLevel = attacker.armour ? attacker.armour.getDefense() : attacker.armourLevel,
        pendant = attacker.pendant ? attacker.pendant : null,
        ring = attacker.ring ? attacker.ring : null,
        boots = attacker.boots ? attacker.boots : null,
        targetArmour = target.armour ? target.armour.getDefense() : target.armourLevel,
        targetPendant = target.pendant ? target.pendant : null,
        targetRing = target.ring ? target.ring : null,
        targetBoots = target.boots ? target.boots : null,
        isPlayer = attacker.type === 'player';

    damageDealt = (isPlayer ? 10 : 0) + attacker.level + ((attacker.level * weaponLevel) / 4) + ((attacker.level + weaponLevel * armourLevel) / 8);

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

    if (damageAmplifier > 1.60)
        damageAmplifier = 1.60;

    damageDealt *= damageAmplifier;

    damageAbsorbed = target.level + (targetArmour / 2);

    if (targetPendant)
        absorptionAmplifier *= targetPendant.getBaseAmplifier();

    if (targetRing)
        absorptionAmplifier *= targetRing.getBaseAmplifier();

    if (targetBoots)
        absorptionAmplifier *= targetBoots.getBaseAmplifier();

    damageAbsorbed *= absorptionAmplifier;

    let damage = damageDealt - damageAbsorbed;

    damage = Math.ceil(damage);

    if (isNaN(damage) || !damage || damage < 0)
        damage = 0;

    return damage;

};

Formulas.getCritical = (attacker, target) => {

    if (!attacker || !target)
        return;

    /**
     * The critical is the player's max hit plus *= critical multiplier of the weapon
     */

    let damage = Formulas.getDamage(attacker, target),
        multiplier = attacker.weapon.abilityLevel / 10;

    return damage *= multiplier;
};

Formulas.getWeaponBreak = (attacker, target) => {

    if (!attacker || !target)
        return;

    let targetArmour = target.getArmourLevel();

    /**
     * The chance a weapon will break ....
     */

    let breakChance = Utils.randomRange(1, 100);

    return breakChance > 75;
};


Formulas.getAoEDamage = (attacker, target) => {
    /**
     * Preliminary setup until this function is expanded
     * and fits in the necessary algorithms.
     */

    return Formulas.getDamage(attacker, target);
};

Formulas.nextExp = (experience) => {
    if (experience < 0)
        return -1;

    for (let i = 1; i < Formulas.LevelExp.length; i++)
        if (experience < Formulas.LevelExp[i])
            return Formulas.LevelExp[i];
};

Formulas.prevExp = (experience) => {
    if (experience < 0)
        return -1;

    for (let i = Constants.MAX_LEVEL; i > 0; i--)
        if (experience > Formulas.LevelExp[i])
            return Formulas.LevelExp[i];
};

Formulas.expToLevel = (experience) => {
    if (experience < 0)
        return -1;

    for (let i = 1; i < Formulas.LevelExp.length; i++)
        if (experience < Formulas.LevelExp[i])
            return i;

    return Constants.MAX_LEVEL;
};

Formulas.getRewardExperience = (player) => {
    if (!player)
        return;

    return (5 + player.level) * player.level;
};

Formulas.getMaxHitPoints = (level) => {
    return 100 + (level * 30);
};

Formulas.getMaxMana = (level) => {
    return 10 + (level * 8);
};
