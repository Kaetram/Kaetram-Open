import Equipment from '../equipment';
import Item from '../../../../objects/item';

import { Modules } from '@kaetram/common/network';
import { Enchantments } from '@kaetram/common/types/item';

export default class Pendant extends Equipment {
    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Pendant, key, count, enchantments);
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);
    }
}
