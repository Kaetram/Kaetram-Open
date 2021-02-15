import Equipment from './equipment';

export default class Weapon extends Equipment {
    level: number;
    damage: number;
    ranged: boolean;

    constructor(
        name: string,
        string: string,
        count: number,
        ability: number,
        abilityLevel: number,
        power: number
    ) {
        super(name, string, count, ability, abilityLevel, power);

        this.level = -1;
        this.damage = -1;
        this.ranged = string?.includes('bow');
    }

    setDamage(damage: number): void {
        this.damage = damage;
    }

    setLevel(level: number): void {
        this.level = level;
    }

    getDamage(): number {
        return this.damage;
    }

    getLevel(): number {
        return this.level;
    }
}
