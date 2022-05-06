import Equipment from './equipment';

export default class Weapon extends Equipment {
    public level = -1;
    public damage = -1;
    public ranged = this.string.includes('bow');

    // setDamage(damage: number): void {
    //     this.damage = damage;
    // }

    // setLevel(level: number): void {
    //     this.level = level;
    // }

    // getDamage(): number {
    //     return this.damage;
    // }

    // getLevel(): number {
    //     return this.level;
    // }
}
