/* global module */

let Equipment = require('./equipment'),
    Items = require('../../../../../util/items'),
    Modules = require('../../../../../util/modules');

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
