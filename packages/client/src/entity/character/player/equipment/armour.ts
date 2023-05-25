import Equipment from './equipment';

import type { Bonuses, Enchantments, Stats } from '@kaetram/common/types/item';

export default class Armour extends Equipment {
    public constructor(
        key = 'clotharmor',
        name = 'Cloth Armor',
        count = -1,
        enchantments: Enchantments = {}
    ) {
        super(key, name, count, enchantments);
    }

    /**
     * An override for the superclass where we specify
     * the default parameters for the key and name of the armour.
     * This will be removed once the paper-doll system
     * is improved to use a base character properly.
     */

    public override update(
        key = 'clotharmor',
        name = 'Cloth Armor',
        count = -1,
        enchantments: Enchantments = {},
        attackStats?: Stats,
        defenseStats?: Stats,
        bonuses?: Bonuses
    ): void {
        super.update(key, name, count, enchantments, attackStats, defenseStats, bonuses);
    }
}
