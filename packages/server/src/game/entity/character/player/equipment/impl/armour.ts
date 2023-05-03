import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';
import type Item from '../../../../objects/item';

export default class Armour extends Equipment {
    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Armour, key, count, enchantments);
    }

    /**
     * @returns Whether or not the armour has the thorns enchantment.
     */

    public hasThorns(): boolean {
        return Modules.Enchantment.Thorns in this.enchantments;
    }

    /**
     * Obtains the thorns level for the armour.
     * @returns The level of the thorns enchantment, otherwise we return 0.
     */

    public getThornsLevel(): number {
        if (!this.hasThorns()) return 0;

        return this.enchantments[Modules.Enchantment.Thorns].level;
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);

        this.movementModifier = item.movementModifier;
    }
}
