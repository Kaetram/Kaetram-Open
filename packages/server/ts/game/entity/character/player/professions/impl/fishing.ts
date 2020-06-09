let _ = require('underscore'),
    Profession = require('./profession');

class Fishing extends Profession {

    constructor(id, player) {
        super(id, player, 'Fishing');

        this.tick = 1000;
    }

}

export default Fishing;
