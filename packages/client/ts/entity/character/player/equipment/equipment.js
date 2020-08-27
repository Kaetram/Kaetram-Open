export default class Equipment {
    constructor(name, string, count, ability, abilityLevel, power) {
        this.name = name;
        this.string = string;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power || 0;
    }

    exists() {
        return this.name !== null && this.name !== 'null';
    }

    getName() {
        return this.name;
    }

    getString() {
        return this.string;
    }

    getCount() {
        return this.count;
    }

    getAbility() {
        return this.ability;
    }

    getAbilityLevel() {
        return this.abilityLevel;
    }

    update(name, string, count, ability, abilityLevel, power) {
        this.name = name;
        this.string = string;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power;
    }
}
