import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Ring extends Equipment {
    public constructor(id: number, count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Ring, id, count, ability, abilityLevel);
    }
}
