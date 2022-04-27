export interface ProcessedArea {
    // Common
    id: number;
    x: number;
    y: number;

    // Area
    width: number;
    height: number;
    polygon?: Position[] | undefined;

    // Door
    destination?: number;
    orientation?: string;
    quest?: string;
    stage?: number;

    // Light
    distance?: number;
    diffuse?: number;
    objects?: Position[];

    // Chest
    entities?: number;
    items?: string;
    spawnX?: number;
    spawnY?: number;
    achievement?: number;

    // Warp
    name?: string; //? also common
    level?: number;

    // Camera
    type?: string;

    // Music
    songName?: string;

    // Overlay
    darkness?: number;
    fog?: string;

    // Dynamic
    quest?: string;
    mapping?: number;
}

export type Tree = 'Oak' | 'IceOak' | 'Palm' | 'IcePalm';
export type Rock = 'BlueSteel';

export interface ProcessedDoor {
    x: number;
    y: number;
    orientation: string;
    quest?: string;
    stage?: number;
}

export interface ProcessedTree {
    data: number[]; // What is considered a tree.
    stump: number[]; // The tree's stump
    cutStump: number[]; // What the tree gets replaced with when cut.
    type: string; // Store type.
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
    trees: ProcessedTree[];
}
