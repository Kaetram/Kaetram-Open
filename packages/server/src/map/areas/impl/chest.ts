import Area from '../area';
import Areas from '../areas';

import World from '../../../game/world';
import Utils from '../../../util/utils';

export default class Chest extends Areas {

    constructor(data: any, world?: World) {
        super(data, world);

        super.load(this.data, (chestArea: Area, rawData: any) => {
            chestArea.maxEntities = rawData.entities || 0;
            chestArea.items = rawData.items;

            chestArea.cx = rawData.spawnX;
            chestArea.cy = rawData.spawnY;

            if (rawData.achievement)
                chestArea.achievement = rawData.achievement;

            chestArea.onEmpty(() => {
                this.spawnChest(chestArea);
            });

            chestArea.onSpawn(() => {
                this.removeChest(chestArea);
            });
        });

        super.message('chest');
    }

    spawnChest(chestArea: Area) {
        if (Utils.timePassed(chestArea.lastSpawn, chestArea.spawnDelay)) return;

        chestArea.chest = this.world.entities.spawnChest(
            chestArea.items,
            chestArea.cx,
            chestArea.cy,
            false, null
        );

        chestArea.lastSpawn = Date.now();
    }

    removeChest(chestArea: Area) {
        if (!chestArea.chest) return;

        this.world.entities.removeChest(chestArea.chest);
        
        chestArea.chest = null;
    }

}