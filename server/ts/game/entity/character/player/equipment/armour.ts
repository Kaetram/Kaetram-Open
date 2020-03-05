import Equipment from './equipment';
import Items from '../../../../../util/items';
import Modules from '../../../../../util/modules';

class Armour extends Equipment {
    public defense: any;
    public ability: any;

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.defense = Items.getArmourLevel(name);
    }

    hasAntiStun() {
        return this.ability === 6;
    }

    setDefense(defense) {
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
