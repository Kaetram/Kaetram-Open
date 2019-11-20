/* global module */

let _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class ChestAreas {

    constructor(world) {
        let self = this;

        self.world = world;

        self.chestAreas = [];

        self.load();
    }

    load() {
        let self = this;

        _.each(map.chestAreas, (m) => {
            let chestArea = new Area(m.id, m.x, m.y, m.width, m.height);

            chestArea.maxEntities = m.entities || 0;
            chestArea.items = m.titems.split(',');
            chestArea.cX = m.tx;
            chestArea.cY = m.ty;
            
            self.chestAreas.push(chestArea);

            chestArea.onEmpty(() => {
                log.info(chestArea);
                log.info(chestArea.items);

                self.spawnChest(chestArea);
            });

            chestArea.onSpawn(() => {
                self.removeChest(chestArea);
            });

        });

        log.info('Loaded ' + self.chestAreas.length + ' chest areas.');
    }

    spawnChest(chestArea) {
        chestArea.chest = this.world.spawnChest(chestArea.items, chestArea.cX, chestArea.cY, false);
    }

    removeChest(chestArea) {
        let self = this;

        if (!chestArea.chest)
            return;

        self.world.removeChest(chestArea.chest);

        chestArea.chest = null;
    }

}

module.exports = ChestAreas;
