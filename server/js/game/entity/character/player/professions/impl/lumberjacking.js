let _ = require('underscore'),
    Packets = require('../../../../../../network/packets'),
    Messages = require('../../../../../../network/messages'),
    Profession = require('./profession'),
    Modules = require('../../../../../../util/modules');

class Lumberjacking extends Profession {

    constructor(id, player) {
        super(id, player);

        let self = this;
    }

    handle(id, treeId) {
        let self = this;

        log.debug('Handling tree: ' + id);

        self.world.destroyTree(id, Modules.Trees[treeId]);
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }

}

module.exports = Lumberjacking;
