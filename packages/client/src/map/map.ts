import _ from 'lodash';

import log from '../lib/log';
import { isInt } from '../utils/util';
import MapWorker from './mapworker?worker';

import type rawMapData from '../../data/maps/map.json';
import type Game from '../game';
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

type RawMapData = typeof rawMapData;
type Position = { x: number; y: number };

export type MapHigh = RawMapData['high'];
export type MapTileset = RawMapData['tilesets'][0];
export type MapTilesets = MapTileset[];
export type MapDepth = RawMapData['depth'];

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

export type FlippedTile = { tileId: number; h: boolean; v: boolean; d: boolean };

interface TileData {
    data: number | number[] | FlippedTile | FlippedTile[];
    isObject: boolean;
    c: boolean; // collision
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
    private renderer;

    public data: number[] = [];
    private objects: unknown[] = [];
    /** Global objects with custom cursors. */
    private cursorTiles: CursorsTiles = [];
    private tilesets: TilesetImageElement[] = [];
    private rawTilesets: MapTilesets = [];

    public grid!: number[][];
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
    private animatedTiles = [];
    private depth!: MapDepth;

    public constructor(private game: Game) {
        this.renderer = game.renderer;

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
        log.debug('Parsing map with Web Workers...');

        let worker = new MapWorker();

        worker.postMessage(1);

        worker.addEventListener('message', (event) => {
            let map: MapData = event.data;

            this.parseMap(map);
            this.grid = map.grid;
            this.mapLoaded = true;
        });
    }

    // TODO - Specify type
    public synchronize(regionData: any): void {
        _.each(regionData, (region) => {
            this.loadRegion(region);
        });
    }

    // TODO - Specify type
    public loadRegion(data: any): void {
        // Use traditional for-loop instead of _

        for (let tile of data) {
            let index = this.coordToIndex(tile.x, tile.y),
                collisionIndex = this.collisions.indexOf(index),
                objectIndex = this.objects.indexOf(index);

            this.data[index] = tile.data;

            if (tile.c && collisionIndex < 0)
                // Adding new collision tileIndex
                this.collisions.push(index);

            if (!tile.c && collisionIndex > -1) {
                // Removing existing collision tileIndex
                let position = this.indexToCoord(index + 1);

                this.collisions.splice(collisionIndex, 1);

                this.grid[position.y][position.x] = 0;
            }

            // if (tile.isObject && objectIndex < 0) this.objects.push(index);

            // if (!tile.isObject && objectIndex > -1) this.objects.splice(objectIndex, 1);

            // if (tile.cursor) this.cursorTiles[index] = tile.cursor;

            // if (!tile.cursor && index in this.cursorTiles) this.cursorTiles[index] = null;
        }

        this.saveRegionData();
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

    private loadTileset(
        rawTileset: MapTileset,
        callback: (tileset: TilesetImageElement) => void
    ): void {
        let tileset = new Image() as TilesetImageElement;

        tileset.index = this.rawTilesets.indexOf(rawTileset);
        tileset.name = rawTileset.imageName;

        let path = `/img/tilesets/${rawTileset.name}.png`;

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

    public updateCollisions(): void {
        _.each(this.collisions, (index) => {
            let position = this.indexToCoord(index);

            if (position.x > this.width - 1) position.x = this.width - 1;

            if (position.y > this.height - 1) position.y = this.height - 1;

            this.grid[position.y][position.x] = 1;
        });
    }

    /**
     * Converts a coordinate (x and y) into an array index.
     * @returns Index position relative to a 1 dimensional array.
     */

    public coordToIndex(x: number, y: number): number {
        return y * this.width + x;
    }

    /**
     * Works in reverse to `coordToIndex`. Takes an index
     * within a one dimensional array and returns the
     * coordinate variant of that index.
     * @param index The index of the coordinate
     */

    public indexToCoord(index: number): Position {
        return {
            x: index % this.width,
            y: Math.floor(index / this.width)
        };
    }

    public isColliding(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y) || !this.grid) return false;

        return this.grid[y][x] === 1;
    }

    public isObject(x: number, y: number): boolean {
        let index = this.coordToIndex(x, y) - 1;

        return this.objects.includes(index);
    }

    public getTileCursor(x: number, y: number): Cursors | null {
        let index = this.coordToIndex(x, y) - 1;

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

    public getTileAnimation(id: number): any {
        return this.animatedTiles[id];
    }

    public getTilesetFromId(id: number): TilesetImageElement | null {
        for (let idx in this.tilesets)
            if (id > this.tilesets[idx].firstGID - 1 && id < this.tilesets[idx].lastGID + 1)
                return this.tilesets[idx];

        return null;
    }

    private saveRegionData(): void {
        this.game.storage.setRegionData(this.data, this.collisions, this.objects, this.cursorTiles);
    }

    public loadRegionData(): void {
        let regionData = this.game.storage.getRegionData(),
            collisions = this.game.storage.getCollisions(),
            objects = this.game.storage.getObjects(),
            cursorTiles = this.game.storage.getCursorTiles();

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
