// Tile that has undergone rotation
export interface TransformedTile {
    tileId: number;
    h: boolean;
    v: boolean;
    d: boolean;
}

// These are tiles straight from the map file.
export type Tile = number | number[];
export type RotatedTile = TransformedTile | TransformedTile[];

// Client tiles are processed tiles that are cached on the client.
export type ClientTile = Tile | RotatedTile;

// Tile data that is sent to the client.
export interface RegionTileData {
    x: number;
    y: number;
    data: Tile;
    animation?: Tile; // animation data
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

// Map data information
export type OverlayType = 'none' | 'inside' | 'freezing' | 'lockX' | 'lockY' | 'player';

export interface ProcessedArea {
    // Common
    id: number;
    x: number;
    y: number;

    // Chest/door/area
    achievement?: string;
    reqAchievement?: string;
    reqQuest?: string;
    reqItem?: string;
    reqItemCount?: number;
    mimic?: boolean;

    // Area
    width: number;
    height: number;
    polygon?: Position[] | undefined;
    ignore?: boolean; // Whether or not to skip movement checking for area.

    // Door
    destination?: number;
    orientation?: string;
    stage?: number;
    npc?: string;

    // Light
    colour?: string;
    distance?: number;
    diffuse?: number;
    objects?: Position[];
    flickerSpeed?: number;
    flickerIntensity?: number;

    // Chest
    entities?: number;
    items?: string;
    spawnX?: number;
    spawnY?: number;

    // Level requirements`
    skill?: string;

    // Warp
    name?: string; //? also common
    level?: number;

    // Camera
    type?: string;

    // Music
    song?: string;

    // Overlay
    darkness?: number;
    rgb?: string;
    fog?: string;

    // Dynamic
    quest?: string;
    mapping?: number;
    animation?: number;

    // Minigame
    minigame?: string;
    mObjectType?: string; // specifies what the object does in the minigame (used by minigame classes).

    // Signs
    text?: string;
}

export type Tree = 'Oak' | 'IceOak' | 'Palm' | 'IcePalm';
export type Rock = 'BlueSteel';

export interface ProcessedDoor {
    x: number;
    y: number;
    orientation: string;
    quest: string;
    achievement: string;
    reqAchievement: string; // Achievement requirement to pass through.
    reqQuest: string;
    reqItem: string;
    reqItemCount: number;
    stage: number;
    skill: string;
    level: number;
    npc: string; // NPC to trigger chat when player can't pass through.
}

export interface ProcessedResource {
    data: FlatTile; // What is considered a resource.
    base: FlatTile; // The base of the resource (the interactable part).
    depleted: FlatTile; // The resource after it has been depleted.
    type: string; // Identifier for the resource.
}

export interface ProcessedTileset {
    firstGid: number;
    lastGid: number;
    path: string;
    relativePath: string;
}

export interface ProcessedAnimation {
    duration: number;
    tileId: number;
}

export interface ProcessedMap {
    width: number;
    height: number;
    tileSize: number;
    version: number;

    data: (number | number[])[];

    // Corresponds to the tile id of the tile that is considered a collision.
    collisions: number[];

    entities: { [tileId: number]: string };

    // tilesetId: firstGid
    tilesets?: ProcessedTileset[];
    animations?: { [tileId: number]: ProcessedAnimation[] };
    depth?: number;

    plateau: { [index: number]: number };

    high: number[];
    objects: number[];
    obstructing?: number[];
    areas: { [name: string]: ProcessedArea[] };
    cursors: { [tileId: number]: string };
}
