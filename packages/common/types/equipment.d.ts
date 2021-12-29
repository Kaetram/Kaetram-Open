import type { Modules } from '../network';

export interface SerializedEquipment {
    username?: string;
    equipments: EquipmentData[];
}

export interface EquipmentData {
    type: Modules.Equipment;
    key: string;
    name: string;
    count: number;
    ability: number;
    abilityLevel: number;
}

export type EquipmentType = 'weapon' | 'armour' | 'pendant' | 'ring' | 'boots';
