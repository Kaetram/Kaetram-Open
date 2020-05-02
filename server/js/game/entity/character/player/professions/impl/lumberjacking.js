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
        let self = this,
            position = self.idToPosition(id);

        if (!(id in self.trees))
            self.trees[id] = {};

        self.searchTree(position.x, position.y, id);

        _.each(self.trees[id], (tile) => {
            let tiles = self.map.clientMap.data[tile.index];

            if (tiles instanceof Array)
                tiles.splice(tiles.indexOf(tile.treeTile), 1);

        });

        // TODO - Update only players within the region instead of globally.

        self.region.updateRegions();

        self.destroyedTrees[id] = self.trees[id];

        self.trees[id] = {};

    }

    /**
     * We recursively look for a tree at a position, find all the
     * tiles that are part of the tree, and remove those trees.
     * Though this system is still quite rigid, it should function
     * for the time being. The downside is that if trees are too
     * close together, the recursive function will 'leak' into
     * the tree not being removed.
     * `refId` refers to the tree we are clicking. We use this
     * variable to help organize trees that are queued.
     */

    searchTree(x, y, refId) {
        let self = this,
            treeTile = self.map.getTree(x, y);

        if (!treeTile)
            return false;

        let id = x + '-' + y;

        if (id in self.trees[refId])
            return false;

        self.trees[refId][id] = {
            index: self.map.gridPositionToIndex(x, y) - 1,
            treeTile: treeTile
        };

        if (self.searchTree(x + 1, y, refId))
            return true;

        if (self.searchTree(x - 1, y, refId))
            return true;

        if (self.searchTree(x, y + 1, refId))
            return true;

        if (self.searchTree(x, y - 1, refId))
            return true;

        return false;
    }

    // Transforms an object's `instance` or `id` into position
    idToPosition(id) {
        let split = id.split('-');

        return { x: parseInt(split[0]), y: parseInt(split[1]) };
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }

}

module.exports = Lumberjacking;
