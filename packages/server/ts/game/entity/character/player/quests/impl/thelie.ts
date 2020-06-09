/* global module */

let Quest = require('../quest'),
    Packets = require('../../../../../network/packets');

class Thelie extends Quest {

    constructor(player, data) {
        super(player, data);

        this.player = player;
        this.data = data;
    }

    load(stage) {
        super.load(stage);
    }

}

export default Thelie;
