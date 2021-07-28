import Items from '../../../../../util/items';
import * as Modules from '@kaetram/common/src/modules';
import Equipment from './equipment';

export default class Boots extends Equipment {
    public bootsLevel;

    constructor(name: string, id: number, count: number, ability: number, abilityLevel: number) {
        super(name, id, count, ability, abilityLevel);

        this.bootsLevel = Items.getBootsLevel(name);
    }

    override getBaseAmplifier(): number {
        return 1 + this.bootsLevel / 200;
    }

    getType(): Modules.Equipment {
        return Modules.Equipment.Boots;
    }
}
