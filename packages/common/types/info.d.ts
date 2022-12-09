import type { Modules } from '../network';

export interface HitData {
    type: Modules.Hits;
    damage: number;
    ranged?: boolean;
    aoe?: number;
    terror?: boolean;
    poison?: boolean;
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

export interface ProfessionsInfo {
    id: number;
    name: string;
    level: number;
    percentage: string;
}
