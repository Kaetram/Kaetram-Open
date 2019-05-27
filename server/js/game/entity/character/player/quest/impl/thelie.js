/* global module */

let Quest = require('../quest'),
    Packets = require('../../../../../network/packets');

class Thelie extends Quest {

    constructor(player, data) {
        super(player, data);

        let self = this;

        self.player = player;
        self.data = data;
    }

    load(stage) {
        let self = this;

        if (stage)
            self.update();
        else
            self.stage = stage;
    }

    update() {
        this.player.save();
    }

}

module.exports = Thelie;