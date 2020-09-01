import Equipment from './equipment';

export default class Armour extends Equipment {
    defence: number;
    constructor(
        name: string,
        string: string,
        count: number,
        ability: number,
        abilityLevel: number,
        power: number
    ) {
        super(name, string, count, ability, abilityLevel, power);

        this.defence = -1;
    }

    setDefence(defence: number): void {
        this.defence = defence;
    }

    getDefence(): number {
        return this.defence;
    }
}
