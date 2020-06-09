export default class Slot {
    constructor(index) {
        var self = this;

        self.index = index;

        self.string = null;
        self.count = -1;
        self.ability = -1;
        self.abilityLevel = -1;

        self.edible = false;
        self.equippable = false;
    }

    load(string, count, ability, abilityLevel, edible, equippable) {
        var self = this;
        self.string = string;
        self.count = count;
        self.ability = ability;
        self.abilityLevel = abilityLevel;

        self.edible = edible;
        self.equippable = equippable;
    }

    empty() {
        var self = this;

        self.string = null;
        self.count = -1;
        self.ability = -1;
        self.abilityLevel = -1;

        self.edible = false;
        self.equippable = false;
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
