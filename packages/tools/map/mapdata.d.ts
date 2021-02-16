export interface Property {
    name: keyof Entity;
    value: never;
}
export interface ObjectGroup {
    objects: {
        polygon: Pos[];
        x: number;
        y: number;
    }[];
}

export interface Tile {
    id: number;
    objectgroup: ObjectGroup;
    properties: Property[];
}

export interface Tileset {
    firstgid: number;
    tilecount: number;
    image: string;
    name: string;
    tiles: Tile[];
}
export interface Layer {
    objects: {
        id: number;
        name: string;
        properties: { value: number | string; name: string }[];
        x: number;
        y: number;
        width: number;
        height: number;
    }[];
    type: 'tilelayer' | 'objectgroup';
    name: string;
    data: number[];
    compression: string;
}

export interface MapData {
    width: number;
    height: number;
    tilewidth: number;
    tilesets: Tileset[];
    layers: Layer[];
}

export interface Entity {
    roaming: boolean;
    type?: string;
    v: never;
    o: never;
    tree: never;
    rock: never;
    cursor: never;
}

interface Entities {
    [tileId: number]: Entity;
}
export interface ChestArea {
    x: number;
    y: number;
    width: number;
    height: number;
    titems?: number;
    tx?: number;
    ty?: number;
}

export interface Chest {
    x: number;
    y: number;
    achievement: string;
    i: string[];
}

export interface Light {
    x: number;
    y: number;
    color: string;
    diffuse: string;
    distance: string;
    id: string;
    type: string;
}

export interface Warp {
    x: number;
    y: number;
    level?: number;
}

export interface MusicArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PVPArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface OverlayArea {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    darkness?: number;
    type?: string;
}

export interface CameraArea {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
}

export interface AchievementArea {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    achievement: string;
}

export interface GameArea {
    x: number;
    y: number;
    width: number;
    height: number;
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

    tilesets: {
        name: string;
        firstGID: number;
        lastGID: number;
        imageName: string;
        scale: number;
    }[];
    animations?: [];
    depth?: number;

    plateau: { [index: number]: number };

    lights: Light[];
    high: number[];
    objects: number[];
    trees: { [tileId: number]: 'Oak' | 'IceOak' | 'Palm' | 'IcePalm' };
    treeIndexes: number[];
    rocks: Record<string, never>;
    rockIndexes: number[];
    pvpAreas: PVPArea[];
    gameAreas: GameArea[];
    doors: {
        [doorId: number]: {
            o: string;
            tx: number;
            ty: number;
            x: number;
            y: number;
        };
    };
    musicAreas: MusicArea[];
    chestAreas: ChestArea[];
    chests: Chest[];
    overlayAreas: OverlayArea[];
    cameraAreas: CameraArea[];
    achievementAreas: AchievementArea[];
    cursors: { [tileId: number]: string };
    warps: {
        [name: string]: Warp;
    };
    layers: [];
}
