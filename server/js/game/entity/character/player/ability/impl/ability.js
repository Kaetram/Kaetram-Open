/* global module */

const Abilities = require('../../../../../../util/abilities');

class Ability {
    constructor(name, type) {
        const self = this;

        self.name = name;
        self.type = type;

        self.level = -1;

        self.data = Abilities.Data[name];
    }
}

module.exports = Ability;
