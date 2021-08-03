import { Modules } from '@kaetram/common/network';

import Items from '../../../../../util/items';
import Equipment from './equipment';

export default class Pendant extends Equipment {
    public pendantLevel;

    public constructor(
        name: string,
        id: number,
        count: number,
        ability: number,
        abilityLevel: number
    ) {
        super(name, id, count, ability, abilityLevel);

        this.pendantLevel = Items.getPendantLevel(name);
    }

    public override getBaseAmplifier(): number {
        return 1 + this.pendantLevel / 100;
    }

    protected getType(): Modules.Equipment {
        return Modules.Equipment.Pendant;
    }
}
