let _ = require('underscore'),
    Packets = require('../../../../../../network/packets'),
    Messages = require('../../../../../../network/messages'),
    Profession = require('./profession'),
    Modules = require('../../../../../../util/modules'),
    Formulas = require('../../../../../../util/formulas'),
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

            if (!self.player.inventory.canHold(Trees.Logs[self.treeId], 1)) {
                self.player.notify('You do not have enough space in your inventory!');
                self.stop();
                return;
            }

            self.player.sendToRegion(new Messages.Animation(self.player.instance, {
                action: Modules.Actions.Attack
            }));

            let probability = Formulas.getTreeChance(self.player, self.treeId);

            if (Utils.randomInt(0, probability) === 2) {
                self.player.inventory.add({
                    id: Trees.Logs[self.treeId],
                    count: 1
                });

                if (self.getTreeDestroyChance())
                    self.world.destroyTree(self.treeObjectId, Modules.Trees[self.treeId]);
            }

        }, self.tick);

        self.started = true;
    }

    getTreeDestroyChance() {
        return Utils.randomInt(0, Trees.Chances[this.treeId]) === 2;
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

        if (!self.player.hasLumberjackingWeapon()) {
            self.player.notify('You do not have an axe to cut this tree with.');
            return;
        }

        self.treeId = treeId;
        self.treeObjectId = id;

        self.start();
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }

}

module.exports = Lumberjacking;
