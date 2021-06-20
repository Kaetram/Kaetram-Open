export default class Equipment {
    public type!: number;

    public constructor(
        public name: string,
        public string: string,
        public count: number,
        public ability: number,
        public abilityLevel: number,
        public power: number | undefined = 0
    ) {}

    public exists(): boolean {
        return this.name !== null && this.name !== 'null';
    }

    // getName(): string {
    //     return this.name;
    // }

    public getString(): string {
        return this.string;
    }

    // getCount(): number {
    //     return this.count;
    // }

    // getAbility(): number {
    //     return this.ability;
    // }

    // getAbilityLevel(): number {
    //     return this.abilityLevel;
    // }

    update(
        name: string,
        string: string,
        count: number,
        ability: number,
        abilityLevel: number,
        power?: number
    ): void {
        this.name = name;
        this.string = string;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power;
    }
}
