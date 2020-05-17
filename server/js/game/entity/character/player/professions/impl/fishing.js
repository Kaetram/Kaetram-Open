let _ = require('underscore'),
    Profession = require('./profession');

class Fishing extends Profession {

    constructor(id, player) {
        super(id, player, 'Fishing');

        let self = this;

        self.tick = 1000;
    }

}

module.exports = Fishing;
