/* global module */

let Equipment = require('./equipment'),
    Items = require('../../../../../util/items');

class Ring extends Equipment {

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.ringLevel = Items.getRingLevel(name);
    }

    getBaseAmplifier() {
        return 1.00 + (this.ringLevel / 100);
    }

}

module.exports = Ring;