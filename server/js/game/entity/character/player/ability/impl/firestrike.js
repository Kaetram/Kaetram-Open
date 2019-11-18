/* global module */

const Ability = require('./ability');

class FireStrike extends Ability {
    constructor(name, type) {
        super(name, type);
    }
}

module.exports = FireStrike;
