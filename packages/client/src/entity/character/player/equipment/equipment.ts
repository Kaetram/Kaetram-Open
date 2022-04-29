export default abstract class Equipment {
    public type!: number;

    public constructor(
        public name = '',
        public string = '',
        public count = 1,
        public ability = -1,
        public abilityLevel = -1,
        public power = 1
    ) {}

    public exists(): boolean {
        return !!this.string;
    }

    public getString(): string {
        return this.string;
    }

    public update(
        name: string,
        string: string,
        count: number,
        ability: number,
        abilityLevel: number,
        power = 1
    ): void {
        this.name = name;
        this.string = string;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power;
    }
}
