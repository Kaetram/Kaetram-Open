/* global module */

import Abilities from '../../../../../../util/abilities';

class Ability {

    constructor(name, type) {

        this.name = name;
        this.type = type;

        this.level = -1;

        this.data = Abilities.Data[name];
    }

    setLevel(level) {
        this.level = level;
    }

}

export default Ability;
