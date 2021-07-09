import Abilities from '../../../../../../util/abilities';

class Ability {
    public name: string;
    public type: number;

    public level: number;

    public data: any;

    constructor(name: string, type: number) {
        this.name = name;
        this.type = type;

        this.level = -1;

        this.data = Abilities.Data[name];
    }

    setLevel(level: number) {
        this.level = level;
    }
}

export default Ability;
