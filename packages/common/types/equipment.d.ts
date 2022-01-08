import type { Modules } from '../network';

export interface SerializedEquipment {
    equipments: EquipmentData[];
}

export interface EquipmentData {
    type: Modules.Equipment;
    key: string;
    name: string;
    count: number;
    ability: number;
    abilityLevel: number;
    power: number;
}

export type EquipmentType = 'weapon' | 'armour' | 'pendant' | 'ring' | 'boots';
