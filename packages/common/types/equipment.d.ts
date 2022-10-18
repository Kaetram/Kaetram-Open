import type { Modules } from '../network';

export interface EquipmentStats {
    crush: number;
    slash: number;
    stab: number;
    magic: number;

    dexterity: number;
    strength: number;
    archery: number;
}

export interface EquipmentData {
    type: Modules.Equipment;
    key: string;
    name?: string;
    count: number;
    ability: number;
    abilityLevel: number;
    ranged?: boolean; // Specifically for weapon type.
    poisonous?: boolean;
    stats?: EquipmentStats;
}

export interface SerializedEquipment {
    equipments: EquipmentData[];
}

export type EquipmentType = 'weapon' | 'armour' | 'pendant' | 'ring' | 'boots';
