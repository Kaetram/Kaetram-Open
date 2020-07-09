/* global module */

import Equipment from './equipment';
import Items from '../../../../../util/items';
import Modules from '../../../../../util/modules';

class Pendant extends Equipment {
    public pendantLevel: number;

    constructor(name: string, id: number, count: number, ability: number, abilityLevel: number) {
        super(name, id, count, ability, abilityLevel);

        this.pendantLevel = Items.getPendantLevel(name);
    }

    getBaseAmplifier() {
        return 1.0 + this.pendantLevel / 100;
    }

    getType() {
        return Modules.Equipment.Pendant;
    }
}

export default Pendant;
