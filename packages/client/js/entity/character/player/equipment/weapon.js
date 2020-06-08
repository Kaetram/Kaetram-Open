import Equipment from './equipment';

export default class Weapon extends Equipment {
    constructor(name, string, count, ability, abilityLevel, power) {
        super(name, string, count, ability, abilityLevel, power);

        this.level = -1;
        this.damage = -1;
        this.ranged = string && string.includes('bow');
    }

    setDamage(damage) {
        this.damage = damage;
    }

    setLevel(level) {
        this.level = level;
    }

    getDamage() {
        return this.damage;
    }

    getLevel() {
        return this.level;
    }
}
