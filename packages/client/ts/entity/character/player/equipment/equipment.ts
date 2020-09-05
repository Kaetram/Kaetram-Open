export default class Equipment {
    name: string;
    string: string;
    count: number;
    ability: number;
    abilityLevel: number;
    power: number;
    type: number;

    constructor(
        name: string,
        string: string,
        count: number,
        ability: number,
        abilityLevel: number,
        power: number
    ) {
        this.name = name;
        this.string = string;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power || 0;
    }

    exists(): boolean {
        return this.name !== null && this.name !== 'null';
    }

    getName(): string {
        return this.name;
    }

    getString(): string {
        return this.string;
    }

    getCount(): number {
        return this.count;
    }

    getAbility(): number {
        return this.ability;
    }

    getAbilityLevel(): number {
        return this.abilityLevel;
    }

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
