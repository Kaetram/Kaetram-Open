import Items from '../../../../../util/items';
import type * as Modules from '@kaetram/common/src/modules';

interface ItemData {
    name: string;
    string: string;
    id: number;
    count: number;
    ability: number;
    abilityLevel: number;
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
