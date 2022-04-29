import type { Tile } from './map';

// Tiles used when sending region data to the client.
export type RegionTile = Tile | RotatedTile | RotatedTile[];

// Tile data that is sent to the client.
export interface RegionTileData {
    x: number;
    y: number;
    data: RegionTile;
    c?: boolean; // collision property
}

export interface RegionData {
    [index: number]: TileInfo[];
}
