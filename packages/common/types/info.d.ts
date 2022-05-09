import type { Modules } from '../network';

export interface HitData {
    type: Modules.Hits;
    damage: number;
    ranged?: boolean;
    aoe?: boolean;
    terror?: boolean;
    poison?: boolean;
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
    position: Position;
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
    instance: string;
    x: number;
    y: number;
}

export interface ProfessionsInfo {
    id: number;
    name: string;
    level: number;
    percentage: string;
}
