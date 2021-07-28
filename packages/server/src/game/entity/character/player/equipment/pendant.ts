import Items from '../../../../../util/items';
import * as Modules from '@kaetram/common/src/modules';
import Equipment from './equipment';

export default class Pendant extends Equipment {
    public pendantLevel;

    constructor(name: string, id: number, count: number, ability: number, abilityLevel: number) {
        super(name, id, count, ability, abilityLevel);

        this.pendantLevel = Items.getPendantLevel(name);
    }

    override getBaseAmplifier(): number {
        return 1 + this.pendantLevel / 100;
    }

    getType(): Modules.Equipment {
        return Modules.Equipment.Pendant;
    }
}
