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

export interface Area {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    properties: { [property: string]: string | number }
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

    high: number[];
    objects: number[];
    trees: { [tileId: number]: 'Oak' | 'IceOak' | 'Palm' | 'IcePalm' };
    treeIndexes: number[];
    rocks: Record<string, never>;
    rockIndexes: number[];
    areas: { [name: string]: Area[] };
    cursors: { [tileId: number]: string };
    layers: [];
}
