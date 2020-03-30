import Abilities from '../../../../../../util/abilities';

/**
 *
 */
class Ability {
    name: any;

    type: any;

    level: number;

    data: any;

    constructor(name, type) {
        this.name = name;
        this.type = type;

        this.level = -1;

        this.data = Abilities.Data[name];
    }
}

export default Ability;
