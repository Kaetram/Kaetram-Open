export interface Door {
    height: number;
    id: number;
    name: string;
    properties: {
        name: string;
        type: string;
        value: number;
    }[];
    rotation: number;
    type: string;
    visible: boolean;
    width: number;
    x: number;
    y: number;
}

// All possible string properties for tiles
export interface PropertyValues {
    roaming?: boolean;
    type?: string;
    v?: never;
    o?: never;
    tree?: string;
    stump?: string;
    cutstump?: string;
    stumpcut?: string;
    rock?: string;
    rockbase?: string;
    rockempty?: string;
    cursor?: never;
}

export interface Property {
    name: keyof PropertyValues;
    value: never;
}

export interface ObjectGroup {
    objects: {
        polygon: Position[];
        x: number;
        y: number;
    }[];
}

export interface Animation {
    duration: number;
    tileid: number;
}

export interface Tile {
    id: number;
    objectgroup: ObjectGroup;
    properties: Property[];
    animation?: Animation[];
}

export interface Tileset {
    firstgid: number;
    tilecount: number;
    image: string;
    name: string;
    tiles: Tile[];
}
interface LayerObject {
    id: number;
    name: string;
    properties: {
        value: never;
        name: keyof ProcessedArea;
    }[];
    x: number;
    y: number;
    width: number;
    height: number;
    polygon: Position[];
}

export interface Layer {
    objects: LayerObject[];
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
