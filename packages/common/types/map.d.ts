export interface ProcessedArea {
    // Common
    id: number;
    x: number;
    y: number;

    // Area
    width: number;
    height: number;
    polygon?: Pos[] | undefined;

    // Door
    destination?: number;
    orientation?: number;

    // Light
    distance?: number;
    diffuse?: number;
    objects?: Pos[];

    // Chest
    entities?: number;
    items?: string;
    spawnX?: number;
    spawnY?: number;
    achievement?: number;

    // Warp
    name: string; //? also common
    level?: number;

    // Camera
    type?: string;

    // Music
    songName?: string;

    // Overlay
    darkness?: number;
    fog?: string;
}

export interface Entities {
    [tileId: number]: Entity;
}

export type Tree = 'Oak' | 'IceOak' | 'Palm' | 'IcePalm';
export type Rock = 'BlueSteel';

export interface ProcessedTileset {
    name: string;
    firstGID: number;
    lastGID: number;
    imageName: string;
    scale: number;
}

export interface ProcessedMap {
    width: number;
    height: number;
    tileSize: number;
    version: number;

    data: (number | number[])[];

    collisions: number[];
    polygons: { [tileId: number]: Pos[] };
    entities: Entities;
    staticEntities: Entities;

    tilesets: ProcessedTileset[];
    animations?: unknown[];
    depth?: number;

    plateau: { [index: number]: number };

    high: number[];
    objects: number[];
    trees: { [tileId: number]: Tree };
    treeIndexes: number[];
    rocks: { [tileId: number]: Rock };
    rockIndexes: number[];
    areas: { [name: string]: ProcessedArea[] };
    cursors: { [tileId: number]: string };
    layers: unknown[];
}
