/* global module */

let Equipment = require('./equipment'),
    Items = require('../../../../../util/items'),
    Modules = require('../../../../../util/modules');

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
