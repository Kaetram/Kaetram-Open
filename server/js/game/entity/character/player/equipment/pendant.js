/* global module */

const Equipment = require('./equipment');
const Items = require('../../../../../util/items');
const Modules = require('../../../../../util/modules');

class Pendant extends Equipment {
    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.pendantLevel = Items.getPendantLevel(name);
    }

    getBaseAmplifier() {
        return 1.00 + (this.pendantLevel / 100);
    }

    getType() {
        return Modules.Equipment.Pendant;
    }
}

module.exports = Pendant;
