import Equipment from '../equipment';
import Item from '../../../../objects/item';

import { Modules } from '@kaetram/common/network';

export default class Weapon extends Equipment {
    public attackRate: number = Modules.Defaults.ATTACK_RATE;

    public constructor(key = '', count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Weapon, key, count, ability, abilityLevel);
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);

        this.ranged = item.isRangedWeapon();
        this.attackRate = item.attackRate;
        this.poisonous = item.poisonous;
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
}
