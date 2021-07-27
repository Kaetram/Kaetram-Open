import Abilities, { AbilitiesData } from '../../../../../../util/abilities';

abstract class Ability {
    public name: string;
    public type: number;

    public level: number;

    public data: AbilitiesData;

    constructor(name: string, type: number) {
        this.name = name;
        this.type = type;

        this.level = -1;

        this.data = Abilities.Data[name];
    }

    setLevel(level: number): void {
        this.level = level;
    }
}

export default Ability;
