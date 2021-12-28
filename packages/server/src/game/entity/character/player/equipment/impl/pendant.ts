import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Pendant extends Equipment {
    public constructor(id: number, count = -1, ability = -1, abilityLevel = -1) {
        super(Modules.Equipment.Pendant, id, count, ability, abilityLevel);
    }
}
