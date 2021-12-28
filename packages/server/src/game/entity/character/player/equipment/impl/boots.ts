import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Boots extends Equipment {
    public constructor(id: number, count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Boots, id, count, ability, abilityLevel);
    }
}
