/* global module */

const Equipment = require('./equipment');
const Items = require('../../../../../util/items');
const Modules = require('../../../../../util/modules');

class Ring extends Equipment {
    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.ringLevel = Items.getRingLevel(name);
    }

    getBaseAmplifier() {
        return 1.00 + (this.ringLevel / 100);
    }

    getType() {
        return Modules.Equipment.Ring;
    }
}

module.exports = Ring;
