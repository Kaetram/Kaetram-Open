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

        this.power = item.attackLevel;
        this.ranged = item.isRangedWeapon();
        this.attackRate = item.attackRate;
    }
}
