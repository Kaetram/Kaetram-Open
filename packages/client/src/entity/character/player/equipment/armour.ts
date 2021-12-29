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
    // private defence = -1;
    // setDefence(defence: number): void {
    //     this.defence = defence;
    // }
    // getDefence(): number {
    //     return this.defence;
    // }
}
