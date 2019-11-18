/* global module */

let Entity = require('../entity'),
    Utils = require('../../../util/utils');

class Chest extends Entity {
    constructor(id, instance, x, y) {
        super(id, 'chest', instance, x, y);

        let self = this;

        self.respawnDuration = 25000;
        self.static = false;

        self.items = [];
    }

    openChest() {
        let self = this;

        if (self.openCallback) self.openCallback();
    }

    respawn() {
        let self = this;

        setTimeout(() => {
            if (self.respawnCallback) self.respawnCallback();
        }, self.respawnDuration);
    }

    getItem() {
        let self = this,
            random = Utils.randomInt(0, self.items.length - 1),
            item = self.items[random];

        /**
         * We must ensure an item is always present in order
         * to avoid any unforeseen circumstances.
         */
        if (!item) return;

        return item;
    }

    onOpen(callback) {
        this.openCallback = callback;
    }

    onRespawn(callback) {
        this.respawnCallback = callback;
    }
}

module.exports = Chest;
