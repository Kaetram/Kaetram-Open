import Equipment from '../equipment';
import Item from '../../../../objects/item';

import { Modules } from '@kaetram/common/network';
import { Enchantments } from '@kaetram/common/types/item';

export default class Armour extends Equipment {
    public movementSpeed = -1;

    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Armour, key, count, enchantments);
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);

        this.movementSpeed = item.movementSpeed;
    }

    /**
     * @returns Whether or not the equipment has a movement modifier.
     */

    public hasMovementModifier(): boolean {
        return this.movementSpeed !== -1;
    }
}
