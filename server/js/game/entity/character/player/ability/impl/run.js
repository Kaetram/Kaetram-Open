/* global module */

let Ability = require('./ability');

class Run extends Ability {

    constructor(name, type) {
        super(name, type);
    }

}

module.exports = Run;