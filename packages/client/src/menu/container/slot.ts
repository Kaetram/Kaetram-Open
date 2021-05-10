export default class Slot {
    index: number;
    string: string | null;
    count: number;
    ability?: number;
    abilityLevel?: number;
    edible?: boolean;
    equippable?: boolean;

    constructor(index: number) {
        this.index = index;

        this.string = null;
        this.count = -1;
        this.ability = -1;
        this.abilityLevel = -1;

        this.edible = false;
        this.equippable = false;
    }

    load(
        string: string | null,
        count: number,
        ability?: number,
        abilityLevel?: number,
        edible?: boolean,
        equippable?: boolean
    ): void {
        this.string = string;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;

        this.edible = edible;
        this.equippable = equippable;
    }

    empty(): void {
        this.string = null;
        this.count = -1;
        this.ability = -1;
        this.abilityLevel = -1;

        this.edible = false;
        this.equippable = false;
    }

    isEmpty(): boolean {
        return !this.string || this.count < 1;
    }

    setCount(count: number): void {
        this.count = count;
    }

    setString(string: string): void {
        this.string = string;
    }
}
