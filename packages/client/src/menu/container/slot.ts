export default class Slot {
    public key: string | null = null;
    public count = -1;

    public ability: number | undefined = -1;
    public abilityLevel: number | undefined = -1;
    public edible? = false;
    public equippable? = false;

    public constructor(public index: number) {}

    public load(
        key: string | null,
        count: number,
        ability?: number,
        abilityLevel?: number,
        edible = false,
        equippable = false
    ): void {
        this.key = key;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;

        this.edible = edible;
        this.equippable = equippable;
    }

    public empty(): void {
        this.key = null;
        this.count = -1;
        this.ability = -1;
        this.abilityLevel = -1;

        this.edible = false;
        this.equippable = false;
    }

    public isEmpty(): boolean {
        return !this.key || this.count < 1;
    }

    public setCount(count: number): void {
        this.count = count;
    }

    // setString(string: string): void {
    //     this.string = string;
    // }
}
