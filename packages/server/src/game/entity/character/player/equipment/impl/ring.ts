import { Modules } from '@kaetram/common/network';
import Item from '../../../../objects/item';
import Equipment from '../equipment';

export default class Ring extends Equipment {
    public constructor(key = '', count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Ring, key, count, ability, abilityLevel);
    }

    /**
     * Override function that adds the equipment's power level.
     */

    public override update(item: Item): void {
        super.update(item);

        this.power = item.ringLevel;
    }
}
