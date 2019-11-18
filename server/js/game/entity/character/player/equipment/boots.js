/* global module */

const Equipment = require('./equipment');
const Items = require('../../../../../util/items');
const Modules = require('../../../../../util/modules');

class Boots extends Equipment {
    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.bootsLevel = Items.getBootsLevel(name);
    }

    getBaseAmplifier() {
        return 1.00 + (this.bootsLevel / 200);
    }

    getType() {
        return Modules.Equipment.Boots;
    }
}

module.exports = Boots;
