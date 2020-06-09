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

        this.tick = 1000;

        this.miningInterval = null;
        this.started = false;
    }

    start() {
        if (this.started)
            return;

        this.miningInterval = setInterval(() => {

            try {



            } catch (e) {}

        }, this.tick);

        this.started = true;
    }

    stop() {
        if (!this.started)
            return;

        this.rockId = null;
        this.targetId = null;

        clearInterval(this.miningInterval);
        this.miningInterval = null;

        this.started = false;
    }

    handle(id, rockId) {
        if (!this.player.hasMiningWeapon()) {
            this.player.notify('You do not have a pickaxe to mine this rock with.');
            return;
        }

        this.rockId = rockId;
        this.targetId = id;

        if (this.level < Rocks.Levels[this.rockId]) {
            this.player.notify(`You must be at least level ${Rocks.Levels[this.rockId]} to mine this rock.`);
            return;
        }

        this.start();
    }

    getRockDestroyChance() {
        return Utils.randomInt(0, Rocks.Chances[this.rockId]) === 2;
    }
}

export default Mining;
