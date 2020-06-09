/* global module */

import Equipment from './equipment';
    import Items from '../../../../../util/items';
    import Modules from '../../../../../util/modules';

class Pendant extends Equipment {

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.pendantLevel = Items.getPendantLevel(name);
    }

    getBaseAmplifier() {
        return 1.00 + (this.pendantLevel / 100);
    }

    getType() {
        return Modules.Equipment.Pendant;
    }
}

export default Pendant;
