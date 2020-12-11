/* global module */

import Items from '../../../../../util/items';

class Equipment {
    public name: string;
    public id: number;
    public count: number;
    public ability: number;
    public abilityLevel: number;

    constructor(name: string, id: number, count: number, ability: number, abilityLevel: number) {
        this.name = name;
        this.id = id;
        this.count = count ? count : 0;
        this.ability = !isNaN(ability) ? ability : -1;
        this.abilityLevel = !isNaN(abilityLevel) ? abilityLevel : -1;
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
        return 1.0;
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
            abilityLevel: this.abilityLevel,
            power: Items.getLevelRequirement(this.name)
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

export default Equipment;
