import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';
import type Item from '../../../../objects/item';

export default class Arrows extends Equipment {
    public projectileName = '';

    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Arrows, key, count, enchantments);
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);

        this.projectileName = item.projectileName;
    }
}
