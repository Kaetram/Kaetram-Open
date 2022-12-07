// Tile that has undergone rotation
export interface RotatedTile {
    tileId: number;
    h: boolean;
    v: boolean;
    d: boolean;
}

// These are tiles straight from the map file.
export type Tile = number | number[];

// Map data information
export type OverlayType = 'none' | 'inside' | 'damage';

export interface ProcessedArea {
    // Common
    id: number;
    x: number;
    y: number;

    // Chest/door/area
    achievement?: string;
    reqAchievement?: string;
    reqQuest?: string;
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

    // Light
    colour?: string;
    distance?: number;
    diffuse?: number;
    objects?: Position[];

    // Chest
    entities?: number;
    items?: string;
    spawnX?: number;
    spawnY?: number;

    // Warp
    name?: string; //? also common
    level?: number; // also used for doors

    // Camera
    type?: string;

    // Music
    song?: string;

    // Overlay
    darkness?: number;
    fog?: string;

    // Dynamic
    quest?: string;
    mapping?: number;

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
    stage: number;
    level: number;
}

export interface ProcessedResource {
    data: number[]; // What is considered a resource.
    base: number[]; // The base of the resource (the interactable part).
    depleted: number[]; // The resource after it has been depleted.
    type: string; // Identifier for the resource.
}

export interface ProcessedTileset {
    name: string;
    firstGID: number;
    lastGID: number;
    imageName: string;
    scale: number;
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

    collisions: number[];
    entities: { [tileId: number]: string };

    // tilesetId: firstGid
    tilesets?: { [tilesetId: number]: number };
    animations?: { [tileId: number]: ProcessedAnimation[] };
    depth?: number;

    plateau: { [index: number]: number };

    high: number[];
    objects: number[];
    areas: { [name: string]: ProcessedArea[] };
    cursors: { [tileId: number]: string };
    trees: ProcessedResource[];
}

export interface ProcessedClientMap {
    width: number;
    height: number;
    tileSize: number;
    version: number;
    high: number[];
    tilesets: { [name: string]: number };
    animations: { [tileId: number]: ProcessedAnimation[] };
    grid?: number[][];
}
