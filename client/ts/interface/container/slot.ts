export default class Slot {
    index: number;
    string: string;
    count: number;
    ability: number;
    abilityLevel: number;
    edible: boolean;
    equippable: boolean;

    constructor(index) {
        this.index = index;

        this.string = null;
        this.count = -1;
        this.ability = -1;
        this.abilityLevel = -1;

        this.edible = false;
        this.equippable = false;
    }

    load(string, count, ability, abilityLevel, edible?, equippable?) {
        this.string = string;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;

        this.edible = edible;
        this.equippable = equippable;
    }

    empty() {
        this.string = null;
        this.count = -1;
        this.ability = -1;
        this.abilityLevel = -1;

        this.edible = false;
        this.equippable = false;
    }

    isEmpty() {
        return !this.string || this.count < 1;
    }

    setCount(count) {
        this.count = count;
    }

    setString(string) {
        this.string = string;
    }
}
