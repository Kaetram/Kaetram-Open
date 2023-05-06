import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';

export default class Chestplate extends Equipment {
    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Chestplate, key, count, enchantments);
    }

    /**
     * @returns Whether or not the chestplate has the thorns enchantment.
     */

    public hasThorns(): boolean {
        return Modules.Enchantment.Thorns in this.enchantments;
    }

    /**
     * Obtains the thorns level for the chestplate.
     * @returns The level of the thorns enchantment, otherwise we return 0.
     */

    public getThornsLevel(): number {
        if (!this.hasThorns()) return 0;

        return this.enchantments[Modules.Enchantment.Thorns].level;
    }
}
