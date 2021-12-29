import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Pendant extends Equipment {
    public constructor(key = '', count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Pendant, key, count, ability, abilityLevel);
    }
}
