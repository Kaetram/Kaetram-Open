/* global module */

import _ from 'underscore';
import Area from '../area';
import log from "../../util/log";
import * as map from '../../../data/map/world_server.json';

class ChestAreas {

    constructor(world) {
        this.world = world;

        this.chestAreas = [];

        this.load();
    }

    load() {
        _.each(map.chestAreas, (m) => {
            let chestArea = new Area(m.id, m.x, m.y, m.width, m.height);

            chestArea.maxEntities = m.entities || 0;
            chestArea.items = m.titems.split(',');
            chestArea.cX = parseInt(m.tx);
            chestArea.cY = parseInt(m.ty);

            if (m.tachievement)
                chestArea.achievement = parseInt(m.tachievement);

            this.chestAreas.push(chestArea);

            chestArea.onEmpty(() => {

                this.spawnChest(chestArea);
            });

            chestArea.onSpawn(() => {
                this.removeChest(chestArea);
            });

        });

        log.info('Loaded ' + this.chestAreas.length + ' chest areas.');
    }

    spawnChest(chestArea) {
        if (new Date().getTime() - chestArea.lastSpawn < chestArea.spawnDelay)
            return;

        chestArea.chest = this.world.spawnChest(chestArea.items, chestArea.cX, chestArea.cY, false);
        chestArea.lastSpawn = new Date().getTime();
    }

    removeChest(chestArea) {
        if (!chestArea.chest)
            return;

        this.world.removeChest(chestArea.chest);

        chestArea.chest = null;
    }

}

export default ChestAreas;
