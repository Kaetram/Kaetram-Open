import type { Modules } from '../network';

export interface EquipmentData {
    type: Modules.Equipment;
    name: string;
    string: string;
    count: number;
    ability: number;
    abilityLevel: number;
    power: number;
}
export type EquipmentType = 'weapon' | 'armour' | 'pendant' | 'ring' | 'boots';

export interface HitData {
    type: Modules.Hits;
    damage: number;
    isRanged: boolean;
    isAoE: boolean;
    hasTerror: boolean;
    isPoison: boolean;
}

export interface SlotData {
    index: number;
    string: string;
    count: number;
    ability: number;
    abilityLevel: number;
}

export interface QuestInfo {
    id: number;
    name: string;
    description: string;
    stage: number;
    finished: boolean;
}

export interface AchievementData {
    id: number;
    name: string;
    type: number | undefined;
    description: string;
    count: number;
    progress: number;
    finished: boolean;
}

export interface ShopData {
    id: number;
    strings: string[];
    names: string[];
    counts: number[];
    prices: number[];
}

export interface RegionTileData {
    index: number;
    position: Pos;
    data: number[];
    c: boolean; // Collision
    isObject: boolean;
    cursor: string | undefined;
}
export interface TilesetData {
    [i: number]: {
        c?: boolean;
        h?: number;
    };
}

export interface BubbleInfo {
    id: string;
    x: number;
    y: number;
}

export interface ProfessionsInfo {
    id: number;
    name: string;
    level: number;
    percentage: string;
}
