import type { Tile, RotatedTile } from './map';

// Tiles used when sending region data to the client.
export type RegionTile = Tile | RotatedTile | RotatedTile[];

// Tile data that is sent to the client.
export interface RegionTileData {
    x: number;
    y: number;
    data: RegionTile;
    c?: boolean; // collision property
    cur?: string; // cursor property
    o?: boolean; // object property
}

export interface RegionData {
    [regionId: number]: RegionTileData[];
}

export interface RegionCache {
    data: RegionData;
    version: number;
}
