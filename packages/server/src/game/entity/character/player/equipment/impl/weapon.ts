import { Modules } from '@kaetram/common/network';
import Item from '../../../../objects/item';
import Equipment from '../equipment';

export default class Weapon extends Equipment {
    public constructor(key = '', count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Weapon, key, count, ability, abilityLevel);
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);

        this.power = item.attackLevel;
        this.rangedWeapon = item.isRangedWeapon();
    }
}
