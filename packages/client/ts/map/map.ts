import glTiled, { GLTilemap, ITilemap } from 'gl-tiled';
import _ from 'lodash';

import mapData from '../../data/maps/map.json';
import Game from '../game';
import log from '../lib/log';
import Renderer from '../renderer/renderer';
import { isInt } from '../utils/util';
import MapWorker from './mapworker';

type MapDataType = typeof mapData;
export interface MapData extends MapDataType {
    grid: number[][];
    blocking: number[];
}

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

/**
 * @todo Need to add TypeScript declarations through `@kaetram/common` when server networks are typed.
 */
interface TileData {
    data: number;
    isObject: boolean;
    isCollision: boolean;
    index: number;
    cursor: string;
}

export type MapCollisions = typeof mapData.collisions;
export type MapHigh = typeof mapData.high;
export type MapLights = typeof mapData.lights;
export type MapTileset = typeof mapData.tilesets[0];
export type MapTilesets = MapTileset[];
export type MapAnimations = typeof mapData.animations;
export type MapDepth = typeof mapData.depth;

export default class Map {
    game: Game;
    renderer: Renderer;
    supportsWorker: boolean;
    data: number[];
    objects: unknown[];
    cursorTiles: { [key: string]: string };
    tilesets: TilesetImageElement[];
    lastSyncData: TileData[];
    grid: number[][];
    webGLMap: GLTilemap;
    tilesetsLoaded: boolean;
    mapLoaded: boolean;
    preloadedData: boolean;
    readyCallback: () => void;

    width: number;
    height: number;
    tileSize: number;

    blocking: number[];
    collisions: MapCollisions;
    high: MapHigh;
    lights: MapLights;
    rawTilesets: MapTilesets;
    animatedTiles: MapAnimations;
    depth: MapDepth;

    constructor(game: Game) {
        this.game = game;
        this.renderer = this.game.renderer;
        this.supportsWorker = this.game.app.hasWorker();

        this.data = [];
        this.objects = [];
        this.cursorTiles = {}; // Global objects with custom cursors
        this.tilesets = [];
        this.rawTilesets = [];
        this.lastSyncData = []; // Prevent unnecessary sync data.

        this.grid = null;
        this.webGLMap = null; // Map used for rendering webGL.

        this.tilesetsLoaded = false;
        this.mapLoaded = false;

        this.preloadedData = false;

        this.load();

        this.ready();
    }

    ready(): void {
        const rC = () => {
            this.readyCallback?.();
        };

        if (this.mapLoaded && this.tilesetsLoaded) rC();
        else
            setTimeout(() => {
                this.loadTilesets();
                this.ready();
            }, 50);
    }

    load(): void {
        if (this.supportsWorker) {
            if (this.game.isDebug()) log.info('Parsing map with Web Workers...');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const worker = new MapWorker() as Worker;

            worker.postMessage(1);

            worker.onmessage = (event) => {
                const map = event.data;

                this.parseMap(map);
                this.grid = map.grid;
                this.mapLoaded = true;
            };
        } else {
            if (this.game.isDebug()) log.info('Parsing map with JSON...');

            this.parseMap(mapData as MapData);
            this.loadCollisions();
            this.mapLoaded = true;
        }
    }

    synchronize(tileData: TileData[]): void {
        // Use traditional for-loop instead of _
        for (let i = 0; i < tileData.length; i++) {
            const tile = tileData[i],
                collisionIndex = this.collisions.indexOf(tile.index),
                objectIndex = this.objects.indexOf(tile.index);

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

        this.lastSyncData = tileData;
    }

    loadTilesets(): void {
        if (this.rawTilesets.length < 1) return;

        _.each(this.rawTilesets, (rawTileset) => {
            this.loadTileset(rawTileset, (tileset) => {
                this.tilesets[tileset.index] = tileset;

                if (this.tilesets.length === this.rawTilesets.length) this.tilesetsLoaded = true;
            });
        });
    }

    async loadTileset(
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

        tileset.onload = () => {
            if (tileset.width % this.tileSize > 0)
                // Prevent uneven tilemaps from loading.
                throw Error(`The tile size is malformed in the tile set: ${tileset.path}`);

            callback(tileset);
        };

        tileset.onerror = () => {
            throw Error(`Could not find tile set: ${tileset.path}`);
        };
    }

    parseMap(map: MapData): void {
        this.width = map.width;
        this.height = map.height;
        this.tileSize = map.tilesize;
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
    loadWebGL(context: WebGLRenderingContext): void {
        const map = this.formatWebGL(),
            resources = {};

        for (let i = 0; i < this.tilesets.length; i++) {
            resources[this.tilesets[i].name] = {
                name: this.tilesets[i].name,
                url: this.tilesets[i].path,
                data: this.tilesets[i],
                extension: 'png'
            };
        }

        if (this.webGLMap) this.webGLMap.glTerminate();

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
    formatWebGL(): ITilemap {
        // Create the object's constants.
        const object = {
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

            hexsidelength: null,
            infinite: null,
            nextlayerid: null,
            nextobjectid: null,
            properties: null,
            staggeraxis: null,
            staggerindex: null
        };

        /* Create 'layers' based on map depth and data. */
        for (let i = 0; i < this.depth; i++) {
            const layerObject = {
                id: i,
                width: object.width,
                height: object.height,
                name: `layer${i}`,
                opacity: 1,
                type: 'tilelayer',
                visible: true,
                x: 0,
                y: 0,
                data: []
            };

            for (let j = 0; j < this.data.length; j++) {
                const tile = this.data[j];

                if (Array.isArray(tile)) {
                    if (tile[i]) layerObject.data[j] = tile[i];
                    else layerObject.data[j] = 0;
                } else if (i === 0) layerObject.data[j] = tile;
                else layerObject.data[j] = 0;
            }

            object.layers.push(layerObject);
        }

        for (let i = 0; i < this.tilesets.length; i++) {
            const tileset = {
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
                const indx = parseInt(tile);

                if (indx > tileset.firstgid - 1 && indx < tileset.tilecount)
                    tileset.tiles.push({
                        animation: this.animatedTiles[tile],
                        id: indx
                    });
            }

            log.info(tileset);

            object.tilesets.push(tileset);
        }

        if (this.game.isDebug()) log.info('Successfully generated the WebGL map.');

        return object as ITilemap;
    }

    synchronizeWebGL(): void {
        this.loadWebGL(this.renderer.backContext as WebGLRenderingContext);
    }

    loadCollisions(): void {
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

    updateCollisions(): void {
        _.each(this.collisions, (index) => {
            const position = this.indexToGridPosition(index + 1);

            if (position.x > this.width - 1) position.x = this.width - 1;

            if (position.y > this.height - 1) position.y = this.height - 1;

            this.grid[position.y][position.x] = 1;
        });
    }

    indexToGridPosition(index: number): Pos {
        index -= 1;

        const x = this.getX(index + 1, this.width),
            y = Math.floor(index / this.width);

        return {
            x: x,
            y: y
        };
    }

    gridPositionToIndex(x: number, y: number): number {
        return y * this.width + x + 1;
    }

    isColliding(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y) || !this.grid) return false;

        return this.grid[y][x] === 1;
    }

    isObject(x: number, y: number): boolean {
        const index = this.gridPositionToIndex(x, y) - 1;

        return this.objects.indexOf(index) > -1;
    }

    getTileCursor(x: number, y: number): string {
        const index = this.gridPositionToIndex(x, y) - 1;

        if (!(index in this.cursorTiles)) return null;

        return this.cursorTiles[index];
    }

    isHighTile(id: number): boolean {
        return this.high.indexOf(id + 1) > -1;
    }

    isLightTile(id: number): boolean {
        return this.lights.indexOf(id + 1) > -1;
    }

    isAnimatedTile(id: number): boolean {
        return id in this.animatedTiles;
    }

    isOutOfBounds(x: number, y: number): boolean {
        return isInt(x) && isInt(y) && (x < 0 || x >= this.width || y < 0 || y >= this.height);
    }

    getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    getTileAnimation(id: number): MapAnimations {
        return this.animatedTiles[id];
    }

    getTilesetFromId(id: number): TilesetImageElement {
        for (const idx in this.tilesets)
            if (id > this.tilesets[idx].firstGID - 1 && id < this.tilesets[idx].lastGID + 1)
                return this.tilesets[idx];

        return null;
    }

    saveRegionData(): void {
        this.game.storage.setRegionData(this.data, this.collisions, this.objects, this.cursorTiles);
    }

    loadRegionData(): void {
        const regionData = this.game.storage.getRegionData(),
            collisions = this.game.storage.getCollisions(),
            objects = this.game.storage.getObjects(),
            cursorTiles = this.game.storage.getCursorTiles();

        if (regionData.length < 1) return;

        this.preloadedData = true;

        this.data = regionData;
        this.collisions = collisions;
        this.objects = objects;
        this.cursorTiles = cursorTiles;

        this.updateCollisions();
    }

    onReady(callback: () => void): void {
        this.readyCallback = callback;
    }
}
