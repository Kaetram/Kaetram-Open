import Equipment from './equipment';

export default class Armour extends Equipment {
    public constructor(
        name = 'Cloth Armor',
        string = 'clotharmor',
        count = 1,
        ability = -1,
        abilityLevel = -1,
        power = 1
    ) {
        super(name, string, count, ability, abilityLevel, power);
    }

    public override update(
        name: string,
        string: string,
        count: number,
        ability: number,
        abilityLevel: number,
        power = 1
    ): void {
        this.name = name ? name : 'Cloth Armour';
        this.string = string ? string : 'clotharmor';
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power;
    }
    // private defence = -1;
    // setDefence(defence: number): void {
    //     this.defence = defence;
    // }
    // getDefence(): number {
    //     return this.defence;
    // }
}
