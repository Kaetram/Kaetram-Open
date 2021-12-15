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
    polygon: Pos[];
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

export interface Entity {
    roaming?: boolean;
    type?: string;
    v?: never;
    o?: never;
    tree?: never;
    rock?: never;
    cursor?: never;
}
