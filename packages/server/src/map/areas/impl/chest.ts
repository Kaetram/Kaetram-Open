import Utils from '@kaetram/common/util/utils';

import World from '../../../game/world';
import Area from '../area';
import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';

export default class Chest extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (chestArea, rawData) => {
            chestArea.maxEntities = rawData.entities || 0;
            chestArea.items = rawData.items!.split(',');

            chestArea.cx = rawData.spawnX!;
            chestArea.cy = rawData.spawnY!;

            if (rawData.achievement) chestArea.achievement = rawData.achievement;

            chestArea.onEmpty(() => {
                this.spawnChest(chestArea);
            });

            chestArea.onSpawn(() => {
                this.removeChest(chestArea);
            });
        });

        super.message('chest');
    }

    private spawnChest(chestArea: Area): void {
        if (Utils.timePassed(chestArea.lastSpawn, chestArea.spawnDelay)) return;

        chestArea.chest = this.world.entities.spawnChest(
            chestArea.items,
            chestArea.cx,
            chestArea.cy,
            false
        );

        chestArea.lastSpawn = Date.now();
    }

    private removeChest(chestArea: Area): void {
        if (!chestArea.chest) return;

        this.world.entities.removeChest(chestArea.chest);

        chestArea.chest = null;
    }
}
