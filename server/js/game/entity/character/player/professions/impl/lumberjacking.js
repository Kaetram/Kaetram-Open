let _ = require('underscore'),
    Packets = require('../../../../../../network/packets'),
    Messages = require('../../../../../../network/messages'),
    Profession = require('./profession'),
    Modules = require('../../../../../../util/modules');

class Lumberjacking extends Profession {

    constructor(id, player) {
        super(id, player);

        let self = this;

        /**
         * We save trees we are about to destroy
         * to the `self.trees` and once they are destroyed
         * we pluck them into the `self.destroyedTrees`.
         * We run a tick that re-spawns them after a while
         * using the data from `self.trees`.
         */

        self.trees = {};
        self.destroyedTrees = {};
    }

    handle(id, treeId) {
        let self = this;

        log.debug('Handling tree: ' + id);
        log.debug('treeId: ' + treeId);

        self.world.destroyTree(id, Modules.Trees[treeId]);
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }

}

module.exports = Lumberjacking;
