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

        self.destroyTree(id, Modules.Trees[treeId]);
    }

    destroyTree(id, treeId) {
        let self = this;

        switch (treeId) {

            case Modules.Trees.Oak:

                let position = self.idToPosition(id);

                self.searchTree(position.x, position.y);

                console.log(self.trees);
                console.log(Object.keys(self.trees).length);

                _.each(self.trees, (tile) => {
                    self.world.push(Packets.PushOpcode.Player, {
                        player: self.player,
                        message: new Messages.Region(Packets.RegionOpcode.Modify, {
                            index: tile,
                            data: []
                        })
                    });
                });

                self.trees = {};

                break;

        }
    }

    /**
     * We recursively look for a tree at a position, find all the
     * tiles that are part of the tree, and remove those trees.
     * Though this system is still quite rigid, it should function
     * for the time being. The downside is that if trees are too
     * close together, the recursive function will 'leak' into
     * the tree not being removed.
     */

    searchTree(x, y) {
        let self = this;

        if (self.isQueueFull())
            return false;

        if (!self.map.isTree(x, y))
            return false;

        let id = x + '-' + y;

        if (id in self.trees)
            return false;

        self.trees[id] = self.map.gridPositionToIndex(x, y) - 1;

        if (self.searchTree(x + 1, y))
            return true;

        if (self.searchTree(x - 1, y))
            return true;

        if (self.searchTree(x, y + 1))
            return true;

        if (self.searchTree(x, y - 1))
            return true;

        return false;
    }

    // Transforms an object's `instance` or `id` into position
    idToPosition(id) {
        let split = id.split('-');

        return { x: parseInt(split[0]), y: parseInt(split[1]) };
    }

    isQueueFull() {
        return Object.keys(this.trees).length > 21;
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }

}

module.exports = Lumberjacking;
