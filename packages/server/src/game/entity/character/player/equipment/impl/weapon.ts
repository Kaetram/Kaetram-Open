import { Modules } from '@kaetram/common/network';

import Equipment from '../equipment';

import type { Enchantments } from '@kaetram/common/types/item';
import type Item from '../../../../objects/item';

export default class Weapon extends Equipment {
    public attackRate: number = Modules.Defaults.ATTACK_RATE;
    public projectileName = '';

    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Weapon, key, count, enchantments);
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);

        this.attackRange = item.attackRange;
        this.attackRate = item.attackRate;
        this.poisonous = item.poisonous;
        this.projectileName = item.projectileName;
    }

    /**
     * A weapon is a strength-based weapon when its strength bonus is greater than 0.
     * @returns Whether or not the weapon's strength bonus is greater than 0.
     */

    public isStrength(): boolean {
        return this.bonuses.strength > 0;
    }

    /**
     * A weapon is a accuracy based weapon when its accuracy bonus is greater than 0.
     * @returns Whether or not the weapon's accuracy bonus is above 0.
     */

    public isAccuracy(): boolean {
        return this.bonuses.accuracy > 0;
    }

    /**
     * Weapons that have a magic bonus are magic-based weapons.
     * @returns Whether or not the weapon is a magic-based weapon.
     */

    public isMagic(): boolean {
        return this.bonuses.magic > 0;
    }
}
