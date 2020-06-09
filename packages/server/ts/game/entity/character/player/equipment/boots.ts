/* global module */

import Equipment from './equipment';
    import Items from '../../../../../util/items';
    import Modules from '../../../../../util/modules';

class Boots extends Equipment {

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.bootsLevel = Items.getBootsLevel(name);
    }

    getBaseAmplifier() {
        return 1.00 + (this.bootsLevel / 200);
    }

    getType() {
        return Modules.Equipment.Boots;
    }

}

export default Boots;
