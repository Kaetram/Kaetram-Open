/* global module */

const Items = require('../../../../../util/items');

class Equipment {
    constructor(name, id, count, ability, abilityLevel) {
        const self = this;

        self.name = name;
        self.id = id;
        self.count = count || 0;
        self.ability = ability || 0;
        self.abilityLevel = abilityLevel || 0;
    }

    getName() {
        return this.name;
    }

    getId() {
        return this.id;
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

    getBaseAmplifier() {
        return 1.00;
    }

    getType() {
        return -1;
    }

    getData() {
        return {
            type: this.getType(),
            name: Items.idToName(this.id),
            string: Items.idToString(this.id),
            count: this.count,
            ability: this.ability,
            abilityLevel: this.abilityLevel
        };
    }

    getString() {
        return Items.idToString(this.id);
    }

    getItem() {
        return {
            name: this.name,
            string: Items.idToString(this.id),
            id: this.id,
            count: this.count,
            ability: this.ability,
            abilityLevel: this.abilityLevel
        };
    }
}

module.exports = Equipment;
