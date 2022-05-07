import _ from 'lodash';

import Renderer from '../renderer/renderer';
import mapData from '../../data/maps/map.json';
import log from '../lib/log';

import type Game from '../game';
import { isInt } from '../utils/util';
import { ProcessedAnimation, ProcessedClientMap } from '@kaetram/common/types/map';
import { RegionData, RegionTile, RegionTileData } from './../../../common/types/region';

export type CursorTiles = { [tileId: number]: string };

interface TilesetInfo extends HTMLImageElement {
    path: string;
    firstGID: number;
    lastGID: number;
    loaded: boolean;
}

export default class Map {
    public width = mapData.width;
    public height = mapData.height;
    public tileSize = mapData.tileSize;

    // Map data
    public data: RegionTile[] = [];
    public grid: number[][] = []; // Two dimensional grid array for collisions/pathing

    private high: number[] = mapData.high;
    private objects: number[] = [];
    private lights: number[] = [];

    private rawTilesets: { [key: string]: number } = mapData.tilesets; // Key is tileset name, value is the firstGID
    private tilesets: { [key: string]: TilesetInfo } = {};
    private cursorTiles: CursorTiles = {};
    private animatedTiles: { [tileId: number]: ProcessedAnimation[] } = mapData.animations;

    private tilesetsLoaded = false;
    public mapLoaded = false;
    public preloadedData = false;

    private readyCallback?(): void;

    public constructor(private game: Game) {
        this.load();
    }

    /**
     * A simple loop that continuously checks if the map has loaded.
     * Once it has, it sends a ready callback signal.
     */

    private ready(): void {
        if (this.mapLoaded && this.tilesetsLoaded) this.readyCallback?.();
        else window.setTimeout(() => this.ready(), 100);
    }

    /**
     * Uses webworkers to create an empty data and collision
     * grid based on the map's dimensions. This can be quite
     * time consuming so we relay it to an external worker
     * to speed up the task.
     */

    private load(): void {
        log.debug('Parsing map with Web Workers...');

        let worker = new Worker(new URL('mapworker.ts', import.meta.url), { type: 'classic' });

        // Send the map's width and height to the webworker.
        worker.postMessage([this.width, this.height]);

        worker.addEventListener('message', (event) => {
            if (event.data.data) this.data = event.data.data;
            if (event.data.grid) this.grid = event.data.grid;

            this.mapLoaded = true;
        });

        this.loadTilesets();

        this.ready();
    }

    /**
     * Iterates through every region in the data and stores the
     * information from each region into our local instance.
     * @param regionData Dictionary containing regionId as key and region data array as value.
     */

    public loadRegions(regionData: RegionData): void {
        _.each(regionData, (data: RegionTileData[]) => this.loadRegion(data));

        // Save data after we finish parsing it.
        this.saveRegionData();
    }

    /**
     * Loads data from all the tiles in the specified region.
     * Each tile contains the x and y grid coordinate, along with information
     * about tileIds, collisions, cursor, and objects.
     * @param data Array of RegionTileData containing the data to load.
     */

    public loadRegion(data: RegionTileData[]): void {
        // For loop is faster than _.each in this case.
        for (let tile of data) {
            let index = this.coordToIndex(tile.x, tile.y),
                objectIndex = this.objects.indexOf(index);

            // Store the tile data so that we can render it later.
            this.data[index] = tile.data;

            // Add collision if the tile is colliding and there's no collision.
            if (tile.c && !this.isColliding(tile.x, tile.y)) this.grid[tile.y][tile.x] = 1;

            // Remove collision if the tile is not colliding and there's a collision.
            if (!tile.c && this.isColliding(tile.x, tile.y)) this.grid[tile.y][tile.x] = 0;

            // If the tile has a cursor, we store it in our cursorTiles dictionary.
            if (tile.cur) this.cursorTiles[index] = tile.cur;

            // If the tile doesn't have a cursor but the index is in our cursorTiles dictionary, we remove it.
            if (!tile.cur && index in this.cursorTiles) this.cursorTiles[index] = '';

            // If the tile has an object, we store it in our objects array.
            if (tile.o && objectIndex < 0) this.objects.push(index);

            // If the tile doesn't have an object but the index is in our objects array, we remove it.
            if (!tile.o && objectIndex > -1) this.objects.splice(objectIndex, 1);
        }
    }

    private loadTilesets(): void {
        let rawTilesetLength = Object.keys(this.rawTilesets).length;

        if (rawTilesetLength === 0) return;

        _.each(this.rawTilesets, (firstGID: number, key: string) => {
            this.loadTileset(firstGID, key, (tileset) => {
                this.tilesets[key] = tileset;

                if (Object.keys(this.tilesets).length === rawTilesetLength)
                    this.tilesetsLoaded = true;
            });
        });
    }

    private loadTileset(
        firstGID: number,
        tilesetId: string,
        callback: (tileset: TilesetInfo) => void
    ): void {
        let tileset = new Image() as TilesetInfo,
            path = `/img/tilesets/tilesheet-${parseInt(tilesetId) + 1}.png`;

        tileset.crossOrigin = 'Anonymous';
        tileset.path = path;
        tileset.src = path;
        tileset.firstGID = firstGID;
        // Equivalent of firstGID + (tileset.width / this.tileSize) * (tileset.height / this.tileSize)
        tileset.lastGID = firstGID + (tileset.width * tileset.height) / this.tileSize ** 2;
        tileset.loaded = true;

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

    /**
     * Checks if a coordinate in the grid collision is
     * marked as a collision.
     * @param x The x grid coordinate.
     * @param y The y grid coordinate.
     * @returns Whether the x and y coordinates in the 2D grid are colliding.
     */

    public isColliding(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y)) return false;

        return this.grid[y][x] === 1;
    }

    public isObject(x: number, y: number): boolean {
        let index = this.coordToIndex(x, y);

        return this.objects.includes(index);
    }

    public getTileCursor(x: number, y: number): string | null {
        let index = this.coordToIndex(x, y);

        if (!(index in this.cursorTiles)) return null;

        return this.cursorTiles[index];
    }

    public isHighTile(id: number): boolean {
        return this.high.includes(id);
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

    public getTilesetFromId(id: number): TilesetInfo | null {
        for (let index in this.tilesets)
            if (id < this.tilesets[index].lastGID) return this.tilesets[index];

        return null;
    }

    /**
     * Saves the current map's data, grid, objects, and cursors to the local storage.
     */

    private saveRegionData(): void {
        this.game.storage.setRegionData(this.data, this.grid, this.objects, this.cursorTiles);
    }

    /**
     * Loads the data from the storage into our map.
     * If the region data exists, then we mark the client's map
     * as having been preloaded. This will get relayed to the server.
     */

    public loadRegionData(): void {
        let data = this.game.storage.getRegionData();

        if (data.regionData.length > 0) {
            this.data = data.regionData;
            this.preloadedData = true;
        }

        this.grid = data.grid;
        this.objects = data.objects;
        this.cursorTiles = data.cursorTiles;
    }

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }
}
