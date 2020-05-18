let _ = require('underscore'),
    Profession = require('./profession'),
    Packets = require('../../../../../../network/packets'),
    Messages = require('../../../../../../network/messages'),
    Modules = require('../../../../../../util/modules'),
    Formulas = require('../../../../../../util/formulas'),
    Utils = require('../../../../../../util/utils'),
    Trees = require('../../../../../../../data/professions/trees');

class Lumberjacking extends Profession {

    constructor(id, player) {
        super(id, player, 'Lumberjacking');

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

            try {

                if (!self.player || !self.isTarget() || self.world.isTreeCut(self.targetId)) {
                    self.stop();
                    return;
                }

                if (!self.treeId || !self.targetId)
                    return;

                if (!self.player.inventory.canHold(Trees.Logs[self.treeId], 1)) {
                    self.player.notify('You do not have enough space in your inventory!');
                    self.stop();
                    return;
                }

                self.sync();
                self.player.sendToRegion(new Messages.Animation(self.player.instance, {
                    action: Modules.Actions.Attack
                }));

                let probability = Formulas.getTreeChance(self.player, self.treeId);

                if (Utils.randomInt(0, probability) === 2) {
                    self.addExperience(Trees.Experience[self.treeId]);

                    self.player.inventory.add({
                        id: Trees.Logs[self.treeId],
                        count: 1
                    });

                    if (self.getTreeDestroyChance())
                        self.world.destroyTree(self.targetId, Modules.Trees[self.treeId]);
                }

            } catch (e) {}

        }, self.tick);

        self.started = true;
    }

    stop() {
        let self = this;

        if (!self.started)
            return;

        self.treeId = null;
        self.targetId = null;

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
        self.targetId = id;

        self.world.destroyTree(self.targetId, Modules.Trees[self.treeId]);

        if (self.level < Trees.Levels[self.treeId]) {
            self.player.notify(`You must be at least level ${Trees.Levels[self.treeId]} to cut this tree!`);
            return;
        }

        //self.start();
    }

    getTreeDestroyChance() {
        return Utils.randomInt(0, Trees.Chances[this.treeId]) === 2;
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }

}

module.exports = Lumberjacking;
