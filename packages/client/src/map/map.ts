import glTiled from 'gl-tiled';
import _ from 'lodash';

import mapData from '../../data/maps/map.json';
import log from '../lib/log';
import { isInt } from '../utils/util';

import type Game from '../game';
import type { GLTilemap, ILayer, ITilemap, ITileset, ITileAnimationFrame } from 'gl-tiled';
import type { MapData } from './mapworker';

interface TilesetImageElement extends HTMLImageElement {
    name: string;
    path: string;
    raw: TilesetImageElement;
    firstGID: number;
    lastGID: number;
    loaded: boolean;
    scale: number;
    index: number;
}

export type MapHigh = typeof mapData.high;
export type MapTileset = typeof mapData.tilesets[0];
export type MapTilesets = MapTileset[];
export type MapDepth = typeof mapData.depth;

export type Cursors =
    | 'hand'
    | 'sword'
    | 'loot'
    | 'target'
    | 'arrow'
    | 'talk'
    | 'spell'
    | 'bow'
    | 'axe';

export interface CursorsTiles {
    [key: number]: Cursors | null;
}

interface TileData {
    data: number;
    isObject: boolean;
    isCollision: boolean;
    index: number;
    cursor: Cursors;
}

interface Resources {
    [name: string]: {
        name: string;
        url: string;
        data: TilesetImageElement;
        extension: string;
    };
}

export default class Map {
    private supportsWorker = this.game.app.hasWorker();
    private renderer = this.game.renderer;

    public data: number[] = [];
    private objects: unknown[] = [];
    /** Global objects with custom cursors. */
    private cursorTiles: CursorsTiles = [];
    private tilesets: TilesetImageElement[] = [];
    private rawTilesets: MapTilesets = [];
    /** Prevent unnecessary sync data. */
    // lastSyncData: TileData[] = [];

    public grid!: number[][];
    /** Map used for rendering webGL. */
    public webGLMap!: GLTilemap;
    private tilesetsLoaded = false;
    public mapLoaded = false;
    public preloadedData = false;
    private readyCallback?(): void;

    public width!: number;
    public height!: number;
    private tileSize!: number;

    private blocking!: number[];
    private collisions!: number[];
    private high!: MapHigh;
    private lights!: number[];
    private animatedTiles!: ITileAnimationFrame[][];
    private depth!: MapDepth;

    public constructor(private game: Game) {
        this.load();

        this.ready();
    }

    private ready(): void {
        if (this.mapLoaded && this.tilesetsLoaded) this.readyCallback?.();
        else
            window.setTimeout(() => {
                this.loadTilesets();

                this.ready();
            }, 50);
    }

    private load(): void {
        if (this.supportsWorker) {
            log.debug('Parsing map with Web Workers...');

            const worker = new Worker(new URL('./mapworker.ts', import.meta.url));

            worker.postMessage(1);

            worker.addEventListener('message', (event) => {
                const map: MapData = event.data;

                this.parseMap(map);
                this.grid = map.grid;
                this.mapLoaded = true;
            });
        } else {
            log.debug('Parsing map with JSON...');

            this.parseMap(mapData as MapData);
            this.loadCollisions();
            this.mapLoaded = true;
        }
    }

    public synchronize(tileData: TileData[]): void {
        // Use traditional for-loop instead of _
        for (const tile of tileData) {
            const collisionIndex = this.collisions.indexOf(tile.index);
            const objectIndex = this.objects.indexOf(tile.index);

            this.data[tile.index] = tile.data;

            if (tile.isCollision && collisionIndex < 0)
                // Adding new collision tileIndex
                this.collisions.push(tile.index);

            if (!tile.isCollision && collisionIndex > -1) {
                // Removing existing collision tileIndex
                const position = this.indexToGridPosition(tile.index + 1);

                this.collisions.splice(collisionIndex, 1);

                this.grid[position.y][position.x] = 0;
            }

            if (tile.isObject && objectIndex < 0) this.objects.push(tile.index);

            if (!tile.isObject && objectIndex > -1) this.objects.splice(objectIndex, 1);

            if (tile.cursor) this.cursorTiles[tile.index] = tile.cursor;

            if (!tile.cursor && tile.index in this.cursorTiles) this.cursorTiles[tile.index] = null;
        }

        if (this.webGLMap) this.synchronizeWebGL();

        this.saveRegionData();

        // this.lastSyncData = tileData;
    }

    private loadTilesets(): void {
        if (this.rawTilesets.length === 0) return;

        _.each(this.rawTilesets, (rawTileset) => {
            this.loadTileset(rawTileset, (tileset) => {
                this.tilesets[tileset.index] = tileset;

                if (this.tilesets.length === this.rawTilesets.length) this.tilesetsLoaded = true;
            });
        });
    }

    private async loadTileset(
        rawTileset: MapTileset,
        callback: (tileset: TilesetImageElement) => void
    ): Promise<void> {
        const tileset = new Image() as TilesetImageElement;

        tileset.index = this.rawTilesets.indexOf(rawTileset);
        tileset.name = rawTileset.imageName;

        const { default: path } = await import(`../../img/tilesets/${tileset.name}`);

        tileset.crossOrigin = 'Anonymous';
        tileset.path = path;
        tileset.src = path;
        tileset.raw = tileset;
        tileset.firstGID = rawTileset.firstGID;
        tileset.lastGID = rawTileset.lastGID;
        tileset.loaded = true;
        tileset.scale = rawTileset.scale;

        tileset.addEventListener('load', () => {
            if (tileset.width % this.tileSize > 0)
                // Prevent uneven tilemaps from loading.
                throw new Error(`The tile size is malformed in the tile set: ${tileset.path}`);

            callback(tileset);
        });

        tileset.addEventListener('error', () => {
            throw new Error(`Could not find tile set: ${tileset.path}`);
        });
    }

    private parseMap(map: MapData): void {
        this.width = map.width;
        this.height = map.height;
        this.tileSize = map.tileSize;
        this.blocking = map.blocking || [];
        this.collisions = map.collisions;
        this.high = map.high;
        this.lights = map.lights;
        this.rawTilesets = map.tilesets;
        this.animatedTiles = map.animations;
        this.depth = map.depth;

        for (let i = 0; i < this.width * this.height; i++) this.data.push(0);
    }

    // Load the webGL map into the memory.
    public loadWebGL(context: WebGLRenderingContext): void {
        const map = this.formatWebGL();

        const resources: Resources = {};

        for (let i = 0; i < this.tilesets.length; i++)
            resources[this.tilesets[i].name] = {
                name: this.tilesets[i].name,
                url: this.tilesets[i].path,
                data: this.tilesets[i],
                extension: 'png'
            };

        this.webGLMap?.glTerminate();

        this.webGLMap = new glTiled.GLTilemap(map, {
            gl: context,
            assetCache: resources
        });

        this.webGLMap.glInitialize(context);
        this.webGLMap.repeatTiles = false;

        context.viewport(0, 0, context.canvas.width, context.canvas.height);
        this.webGLMap.resizeViewport(context.canvas.width, context.canvas.height);
    }

    /**
     * To reduce development strain, we convert the entirety of the client
     * map into the bare minimum necessary for the gl-tiled library.
     * This is because gl-tiled uses the original Tiled mapping format.
     * It is easier for us to adapt to that format than to rewrite
     * the entire library adapted for Kaetram.
     */
    private formatWebGL(): ITilemap {
        // Create the object's constants.
        const object: ITilemap = {
            // compressionlevel: -1,
            width: this.width,
            height: this.height,
            tilewidth: this.tileSize,
            tileheight: this.tileSize,
            type: 'map',
            version: 1.2,
            tiledversion: '1.3.1',
            orientation: 'orthogonal',
            renderorder: 'right-down',
            layers: [],
            tilesets: [],

            hexsidelength: null!,
            infinite: null!,
            nextlayerid: null!,
            nextobjectid: null!,
            properties: null!,
            staggeraxis: null!,
            staggerindex: null!
        };

        /* Create 'layers' based on map depth and data. */
        for (let i = 0; i < this.depth; i++) {
            const layerObject: ILayer = {
                id: i,
                width: object.width,
                height: object.height,
                name: `layer${i}`,
                opacity: 1,
                type: 'tilelayer',
                visible: true,
                x: 0,
                y: 0,
                data: [],
                properties: [],
                starty: 0
            };

            for (let j = 0; j < this.data.length; j++) {
                const tile = this.data[j];

                const { data } = layerObject as { data: number[] };

                if (Array.isArray(tile))
                    if (tile[i]) data[j] = tile[i];
                    else data[j] = 0;
                else if (i === 0) data[j] = tile;
                else data[j] = 0;
            }

            object.layers.push(layerObject);
        }

        for (let i = 0; i < this.tilesets.length; i++) {
            const tileset: ITileset = {
                columns: 64,
                margin: 0,
                spacing: 0,
                firstgid: this.tilesets[i].firstGID,
                image: this.tilesets[i].name,
                imagewidth: this.tilesets[i].width,
                imageheight: this.tilesets[i].height,
                name: this.tilesets[i].name.split('.png')[0],
                tilecount: (this.tilesets[i].width / 16) * (this.tilesets[i].height / 16),
                tilewidth: object.tilewidth,
                tileheight: object.tileheight,
                tiles: []
            };

            for (const tile in this.animatedTiles) {
                if (!Object.prototype.hasOwnProperty.call(this.animatedTiles, tile)) continue;

                const id = parseInt(tile);

                if (id > tileset.firstgid - 1 && id < tileset.tilecount)
                    tileset.tiles!.push({
                        animation: this.animatedTiles[tile],
                        id
                    });
            }

            log.info(tileset);

            object.tilesets.push(tileset);
        }

        log.debug('Successfully generated the WebGL map.');

        return object;
    }

    private synchronizeWebGL(): void {
        this.loadWebGL(this.renderer.backContext as WebGLRenderingContext);
    }

    private loadCollisions(): void {
        this.grid = [];

        for (let i = 0; i < this.height; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.width; j++) this.grid[i][j] = 0;
        }

        _.each(this.collisions, (index) => {
            const position = this.indexToGridPosition(index + 1);
            this.grid[position.y][position.x] = 1;
        });

        _.each(this.blocking, (index) => {
            const position = this.indexToGridPosition(index + 1);

            if (this.grid[position.y]) this.grid[position.y][position.x] = 1;
        });
    }

    public updateCollisions(): void {
        _.each(this.collisions, (index) => {
            const position = this.indexToGridPosition(index + 1);

            if (position.x > this.width - 1) position.x = this.width - 1;

            if (position.y > this.height - 1) position.y = this.height - 1;

            this.grid[position.y][position.x] = 1;
        });
    }

    public indexToGridPosition(index: number): Pos {
        index -= 1;

        const x = this.getX(index + 1, this.width);
        const y = Math.floor(index / this.width);

        return {
            x,
            y
        };
    }

    public gridPositionToIndex(x: number, y: number): number {
        return y * this.width + x + 1;
    }

    public isColliding(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y) || !this.grid) return false;

        return this.grid[y][x] === 1;
    }

    public isObject(x: number, y: number): boolean {
        const index = this.gridPositionToIndex(x, y) - 1;

        return this.objects.includes(index);
    }

    public getTileCursor(x: number, y: number): Cursors | null {
        const index = this.gridPositionToIndex(x, y) - 1;

        if (!(index in this.cursorTiles)) return null;

        return this.cursorTiles[index];
    }

    public isHighTile(id: number): boolean {
        return this.high.includes(id + 1);
    }

    public isLightTile(id: number): boolean {
        return this.lights.includes(id + 1);
    }

    public isAnimatedTile(id: number): boolean {
        return id in this.animatedTiles;
    }

    public isOutOfBounds(x: number, y: number): boolean {
        return isInt(x) && isInt(y) && (x < 0 || x >= this.width || y < 0 || y >= this.height);
    }

    private getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    public getTileAnimation(id: number): ITileAnimationFrame[] {
        return this.animatedTiles[id];
    }

    public getTilesetFromId(id: number): TilesetImageElement | null {
        for (const idx in this.tilesets)
            if (id > this.tilesets[idx].firstGID - 1 && id < this.tilesets[idx].lastGID + 1)
                return this.tilesets[idx];

        return null;
    }

    private saveRegionData(): void {
        this.game.storage.setRegionData(this.data, this.collisions, this.objects, this.cursorTiles);
    }

    public loadRegionData(): void {
        const regionData = this.game.storage.getRegionData();
        const collisions = this.game.storage.getCollisions();
        const objects = this.game.storage.getObjects();
        const cursorTiles = this.game.storage.getCursorTiles();

        if (regionData.length === 0) return;

        this.preloadedData = true;

        this.data = regionData;
        this.collisions = collisions;
        this.objects = objects;
        this.cursorTiles = cursorTiles;

        this.updateCollisions();
    }

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }
}
