import type { Modules } from '../network';

export interface EquipmentData {
    type: Modules.Equipment;
    key: string;
    name: string;
    count: number;
    ability: number;
    abilityLevel: number;
    power: number;
    ranged?: boolean; // Specifically for weapon type.
    poisonous?: boolean;
}

export interface SerializedEquipment {
    equipments: EquipmentData[];
}

export type EquipmentType = 'weapon' | 'armour' | 'pendant' | 'ring' | 'boots';
