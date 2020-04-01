/**
 * The children of these classes are responsible for
 * clear and concise ways of organizing stats of weapons
 * in the client side. This does not dictate the damage,
 * defense or bonus stats, it's just for looks.
 */
export default class Equipment {
    type: string;
    name: string;
    string: string;
    count: string;
    ability: string;
    abilityLevel: string;
    power: string;

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
