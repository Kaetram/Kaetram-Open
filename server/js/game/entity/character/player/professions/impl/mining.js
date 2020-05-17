let _ = require('underscore'),
    Profession = require('./profession'),
    Packets = require('../../../../../../network/packets'),
    Messages = require('../../../../../../network/messages'),
    Modules = require('../../../../../../util/modules'),
    Formulas = require('../../../../../../util/formulas'),
    Utils = require('../../../../../../util/utils'),
    Rocks = require('../../../../../../../data/professions/rocks');

class Mining extends Profession {

    constructor(id, player) {
        super(id, player, 'Mining');

        let self = this;

        self.tick = 1000;

        self.miningInterval = null;
        self.started = false;
    }

    start() {
        let self = this;

        if (self.started)
            return;

        self.miningInterval = setInterval(() => {



        }, self.tick);

        self.started = true;
    }

    stop() {
        let self = this;

        if (!self.started)
            return;

        self.rockId = null;
        self.targetId = null;

        clearInterval(self.miningInterval);
        self.miningInterval = null;

        self.started = false;
    }

    handle(id, rockId) {
        let self = this;

        if (!self.player.hasMiningWeapon()) {
            self.player.notify('You do not have a pickaxe to mine this rock with.');
            return;
        }

        self.rockId = rockId;
        self.targetId = id;

        if (self.level < Rocks.Levels[self.rockId]) {
            self.player.notify(`You must be at least level ${Rocks.Levels[self.rockId]} to mine this rock.`);
            return;
        }

        self.start();
    }

    getRockDestroyChance() {
        return Utils.randomInt(0, Rocks.Chances[this.rockId]) === 2;
    }
}

module.exports = Mining;
