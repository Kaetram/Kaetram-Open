export interface MapData {
    width: number;
    height: number;
    tileSize: number;
    version: number;

    data: any[];

    collisions: number[];
    polygons: any;
    entities: any;
    staticEntities: any;

    tilesets?: any;
    animations?: any;
    depth?: number;

    plateau: any;

    lights: any[];
    high: any[];
    objects: any[];
    trees: any;
    treeIndexes: any[];
    rocks: any;
    rockIndexes: any[];
    pvpAreas: any[];
    gameAreas: any[];
    doors: any;
    musicAreas: any[];
    chestAreas: any[];
    chests: any[];
    overlayAreas: any[];
    cameraAreas: any[];
    achievementAreas: any[];
    cursors: any;
    warps: any;
    layers: any[];
}

export default MapData;