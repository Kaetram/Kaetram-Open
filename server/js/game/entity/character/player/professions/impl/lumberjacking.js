let _ = require('underscore'),
    Packets = require('../../../../../../network/packets'),
    Messages = require('../../../../../../network/messages'),
    Profession = require('./profession'),
    Modules = require('../../../../../../util/modules'),
    Utils = require('../../../../../../util/utils'),
    Trees = require('../../../../../../../data/trees');

class Lumberjacking extends Profession {

    constructor(id, player) {
        super(id, player);

        let self = this;

        self.tick = 1000;

        self.cuttingInterval = null;
        self.started = false;
    }

    start() {
        let self = this;

        if (self.started)
            return;

        self.cuttingInterval = setInterval(() => {

            if (self.world.isTreeCut(self.treeObjectId)) {
                self.stop();
                return;
            }

            if (!self.treeId || !self.treeObjectId)
                return;

            self.player.sendToRegion(new Messages.Animation(self.player.instance, {
                action: Modules.Actions.Attack
            }));

            if (Utils.randomInt(0, Trees.Chances[self.treeId]) === 4)
                self.world.destroyTree(self.treeObjectId, Modules.Trees[self.treeId]);

        }, self.tick);

        self.started = true;
    }

    stop() {
        let self = this;

        if (!self.started)
            return;

        self.treeId = null;
        self.treeObjectId = null;

        clearInterval(self.cuttingInterval);
        self.cuttingInterval = null;

        self.started = false;
    }

    handle(id, treeId) {
        let self = this;

        self.treeId = treeId;
        self.treeObjectId = id;

        self.start();
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }

}

module.exports = Lumberjacking;
