/* global module */

let Equipment = require('./equipment'),
    Items = require('../../../../../util/items'),
    Modules = require('../../../../../util/modules');

class Weapon extends Equipment {

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        let self = this;

        self.level = Items.getWeaponLevel(name);
        self.ranged = Items.isArcherWeapon(name);

        log.debug(`weapon level: ${self.level}`);

        self.breakable = false;
    }

    getBaseAmplifier() {
        let base = super.getBaseAmplifier();

        return base + (0.05 * this.abilityLevel);
    }

    hasCritical() {
        return this.ability === 1;
    }

    hasExplosive() {
        return this.ability === 4;
    }

    hasStun() {
        return this.ability === 5;
    }

    isRanged() {
        return this.ranged
    }

    setLevel(level) {
        this.level = level;
    }

    getLevel() {
        return this.level;
    }

    getType() {
        return Modules.Equipment.Weapon;
    }

}

module.exports = Weapon;
