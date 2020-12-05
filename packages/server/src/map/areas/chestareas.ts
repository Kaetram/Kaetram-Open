/* global module */

import _ from 'lodash';
import Area from '../area';
import World from '../../game/world';
import map from '../../../data/map/world_server.json';
import log from '../../util/log';

class ChestAreas {
    world: World;
    chestAreas: any;

    constructor(world: World) {
        this.world = world;

        this.chestAreas = [];

        this.load();
    }

    load() {
        _.each(map.chestAreas, (m: any) => {
            let chestArea: any = new Area(m.id, m.x, m.y, m.width, m.height);

            chestArea.maxEntities = m.entities || 0;
            chestArea.items = m.titems.split(',');
            chestArea.cX = parseInt(m.tx);
            chestArea.cY = parseInt(m.ty);

            if (m.tachievement) chestArea.achievement = parseInt(m.tachievement);

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

    spawnChest(chestArea: any) {
        if (new Date().getTime() - chestArea.lastSpawn < chestArea.spawnDelay) return;

        chestArea.chest = this.world.spawnChest(
            chestArea.items,
            chestArea.cX,
            chestArea.cY,
            null,
            false
        );
        chestArea.lastSpawn = new Date().getTime();
    }

    removeChest(chestArea: any) {
        if (!chestArea.chest) return;

        this.world.removeChest(chestArea.chest);

        chestArea.chest = null;
    }
}

export default ChestAreas;
