export default class Slot {
    public key = 'null';
    public count = -1;
    public name = '';

    public ability = -1;
    public abilityLevel = -1;
    public edible = false;
    public equippable = false;
    public price = 0;

    public constructor(public index: number) {}

    public load(
        key = 'null',
        count: number,
        ability = -1,
        abilityLevel = -1,
        edible = false,
        equippable = false,
        name = '',
        price = 0
    ): void {
        this.key = key;
        this.count = count;
        this.name = name;
        this.ability = ability;
        this.abilityLevel = abilityLevel;

        this.edible = edible;
        this.equippable = equippable;
        this.price = price;
    }

    public empty(): void {
        this.key = 'null';
        this.count = -1;
        this.name = '';
        this.ability = -1;
        this.abilityLevel = -1;

        this.edible = false;
        this.equippable = false;
        this.price = 0;
    }

    public isEmpty(): boolean {
        return !this.key || this.count < 1;
    }

    public setCount(count: number): void {
        this.count = count;
    }
}
