/* global module */

import Equipment from './equipment';
import Items from '../../../../../util/items';
import Modules from '../../../../../util/modules';

class Armour extends Equipment {
    public defense: number;

    constructor(name: string, id: number, count: number, ability: number, abilityLevel: number) {
        super(name, id, count, ability, abilityLevel);

        this.defense = Items.getArmourLevel(name);
    }

    hasAntiStun() {
        return this.ability === 6;
    }

    setDefense(defense: number) {
        this.defense = defense;
    }

    getDefense() {
        return this.defense;
    }

    getType() {
        return Modules.Equipment.Armour;
    }
}

export default Armour;
