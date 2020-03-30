import Equipment from './equipment';
import Items from '../../../../../util/items';
import Modules from '../../../../../util/modules';

/**
 *
 */
class Ring extends Equipment {
    public ringLevel: any;

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.ringLevel = Items.getRingLevel(name);
    }

    getBaseAmplifier() {
        return 1.0 + this.ringLevel / 100;
    }

    getType() {
        return Modules.Equipment.Ring;
    }
}

export default Ring;
