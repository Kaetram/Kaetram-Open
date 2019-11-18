/* global module */

const _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class ChestAreas {
    constructor(world) {
        const self = this;

        self.world = world;

        self.chestAreas = [];

        self.load();
    }

    load() {
        const self = this;

        _.each(map.chestAreas, m => {
            const chestArea = new Area(m.id, m.x, m.y, m.width, m.height);

            chestArea.maxEntities = m.entities;
            chestArea.items = m.i;
            chestArea.cX = m.tx;
            chestArea.cY = m.ty;

            self.chestAreas.push(chestArea);

            chestArea.onEmpty(() => {
                self.spawnChest(this);
            });

            chestArea.onSpawn(() => {
                self.removeChest(this);
            });
        });

        log.info('Loaded ' + self.chestAreas.length + ' chest areas.');
    }

    spawnChest(chestArea) {
        chestArea.chest = this.world.spawnChest(chestArea.items, chestArea.cX, chestArea.cY, false);
    }

    removeChest(chestArea) {
        const self = this;

        if (!chestArea.chest)
            return;

        self.world.removeChest(chestArea.chest);

        chestArea.chest = null;
    }
}

module.exports = ChestAreas;
