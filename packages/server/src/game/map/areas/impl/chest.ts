import Areas from '../areas';

import Utils from '@kaetram/common/util/utils';

import type { ProcessedArea } from '@kaetram/common/types/map';
import type Character from '../../../entity/character/character';
import type Player from '../../../entity/character/player/player';
import type World from '../../../world';
import type Area from '../area';

export default class Chest extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (chestArea, rawData) => {
            chestArea.maxEntities = rawData.entities || 0;
            chestArea.items = rawData.items!.split(',');

            chestArea.cx = rawData.spawnX!;
            chestArea.cy = rawData.spawnY!;

            // Achievement we reward to player when they loot the chest.
            if (rawData.achievement) chestArea.achievement = rawData.achievement;

            // Once the area is cleared of mobs callback.
            chestArea.onEmpty((attacker?: Character) => {
                this.spawnChest(chestArea);

                // Award the player with the achievement.
                if (attacker && chestArea.achievement)
                    (attacker as Player).achievements?.get(chestArea.achievement)?.finish();
            });

            chestArea.onSpawn(() => this.removeChest(chestArea));
        });

        super.message('chest');
    }

    /**
     * Once the area has been cleared of mobs belonging to it, we want
     * to spawn the reward chest.
     * @param chestArea The area that the chest belongs to, used to determine
     * the position at which the chest will spawn.
     */

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

    /**
     * Deletes a chest from the area if it hasn't been looted.
     * @param chestArea The area of the chest that is being removed.
     */

    private removeChest(chestArea: Area): void {
        if (!chestArea.chest) return;

        this.world.entities.removeChest(chestArea.chest);

        chestArea.chest = null;
    }
}
