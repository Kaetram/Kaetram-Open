/* global module */

let Equipment = require('./equipment'),
    Items = require('../../../../../util/items');

class Boots extends Equipment {

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.bootsLevel = Items.getBootsLevel(name);
    }

    getBaseAmplifier() {
        return 1.00 + (this.bootsLevel / 200);
    }

}

module.exports = Boots;