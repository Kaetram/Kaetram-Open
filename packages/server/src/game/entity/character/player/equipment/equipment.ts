import Items from '../../../../../util/items';

import type * as Modules from '@kaetram/common/src/modules';

export interface ItemData {
    count?: number;
    id?: number;
    instance?: string;
    name?: string;
    string?: string;
    ability?: number;
    abilityLevel?: number;
}

export interface EquipmentData {
    type: Modules.Equipment;
    name: string;
    string: string;
    count: number;
    ability: number;
    abilityLevel: number;
    power: number;
}

export default abstract class Equipment {
    public count;
    public ability;
    public abilityLevel;

    constructor(
        public name: string,
        public id: number,
        count: number,
        ability: number,
        abilityLevel: number
    ) {
        this.count = count ? count : 0;
        this.ability = !isNaN(ability) ? ability : -1;
        this.abilityLevel = !isNaN(abilityLevel) ? abilityLevel : -1;
    }

    getName(): string {
        return this.name;
    }

    getId(): number {
        return this.id;
    }

    getCount(): number {
        return this.count;
    }

    getAbility(): number {
        return this.ability;
    }

    getAbilityLevel(): number {
        return this.abilityLevel;
    }

    getBaseAmplifier(): number {
        return 1;
    }

    abstract getType(): Modules.Equipment;

    getData(): EquipmentData {
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

    getString(): string {
        return Items.idToString(this.id);
    }

    getItem(): ItemData {
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
