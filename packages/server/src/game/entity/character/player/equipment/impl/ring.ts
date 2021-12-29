import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Ring extends Equipment {
    public constructor(key = '', count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Ring, key, count, ability, abilityLevel);
    }
}
