import Equipment from './equipment';

import { Stats, Bonuses } from '@kaetram/common/types/item';

export default class Armour extends Equipment {
    public constructor(
        key = 'clotharmor',
        name = 'Cloth Armor',
        count = 1,
        ability = -1,
        abilityLevel = -1
    ) {
        super(key, name, count, ability, abilityLevel);
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
        count = 0,
        ability = -1,
        abilityLevel = -1,
        ranged = false,
        attackStats?: Stats,
        defenseStats?: Stats,
        bonuses?: Bonuses
    ): void {
        super.update(
            key,
            name,
            count,
            ability,
            abilityLevel,
            ranged,
            attackStats,
            defenseStats,
            bonuses
        );
    }
}
