import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Boots extends Equipment {
    public constructor(key = '', count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Boots, key, count, ability, abilityLevel);
    }
}
