import { Modules } from '@kaetram/common/network';

import Items from '../../../../../util/items';
import Equipment from './equipment';

export default class Boots extends Equipment {
    public bootsLevel;

    public constructor(
        name: string,
        id: number,
        count: number,
        ability: number,
        abilityLevel: number
    ) {
        super(name, id, count, ability, abilityLevel);

        this.bootsLevel = Items.getBootsLevel(name);
    }

    public override getBaseAmplifier(): number {
        return 1 + this.bootsLevel / 200;
    }

    protected getType(): Modules.Equipment {
        return Modules.Equipment.Boots;
    }
}
