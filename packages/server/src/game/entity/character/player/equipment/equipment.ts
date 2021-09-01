import Items from '../../../../../util/items';

import type { Modules } from '@kaetram/common/network';
import type { EquipmentData } from '@kaetram/common/types/info';

export interface ItemData {
    count?: number | undefined;
    id: number | undefined;
    instance?: string;
    name?: string;
    string?: string;
    ability?: number;
    abilityLevel?: number;
}

export default abstract class Equipment {
    public count;
    public ability;
    public abilityLevel;

    protected constructor(
        public name: string,
        public id: number,
        count: number,
        ability: number,
        abilityLevel: number
    ) {
        this.count = count || 0;
        this.ability = !isNaN(ability) ? ability : -1;
        this.abilityLevel = !isNaN(abilityLevel) ? abilityLevel : -1;
    }

    public getName(): string {
        return this.name;
    }

    public getId(): number {
        return this.id;
    }

    public getCount(): number {
        return this.count;
    }

    public getAbility(): number {
        return this.ability;
    }

    public getAbilityLevel(): number {
        return this.abilityLevel;
    }

    public getBaseAmplifier(): number {
        return 1;
    }

    protected abstract getType(): Modules.Equipment;

    public getData(): EquipmentData {
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

    public getString(): string {
        return Items.idToString(this.id);
    }

    public getItem(): ItemData {
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
