import mapData from '../../data/maps/map.json';
import log from '../lib/log';
import Utils, { isInt } from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type {
    ProcessedAnimation,
    RegionData,
    RegionTile,
    RegionTileData
} from '@kaetram/common/types/map';
import type Game from '../game';

export interface CursorTiles {
    [tileId: number]: string;
}

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

    private rawTilesets: { [key: string]: number } = mapData.tilesets; // Key is tileset id, value is the firstGID
    private tilesets: { [key: string]: TilesetInfo } = {};
    private cursorTiles: CursorTiles = {};
    private animatedTiles: { [tileId: number]: ProcessedAnimation[] } = mapData.animations;

    public mapLoaded = false;
    public regionsLoaded = 0;
    private tilesetsLoaded = false;

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

        // Store tile size globally into the utils.
        Utils.tileSize = this.tileSize;
        Utils.sideLength = this.width / Modules.Constants.MAP_DIVISION_SIZE;
        Utils.thirdTile = this.tileSize / 3;
        Utils.tileAndAQuarter = this.tileSize * 1.25;

        let worker = new Worker(new URL('mapworker.ts', import.meta.url), { type: 'classic' });

        // Send the map's width and height to the webworker.
        worker.postMessage([this.width, this.height]);

        worker.addEventListener('message', (event) => {
            if (event.data.data) this.data = event.data.data;
            if (event.data.grid) this.grid = event.data.grid;

            this.loadRegionData();

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
        for (let region in regionData) this.loadRegion(regionData[region], parseInt(region));

        // Save data after we finish parsing it.
        this.saveMapData();
    }

    /**
     * Loads data from all the tiles in the specified region.
     * Each tile contains the x and y grid coordinate, along with information
     * about tileIds, collisions, cursor, and objects.
     * @param data Array of RegionTileData containing the data to load.
     */

    public loadRegion(data: RegionTileData[], region: number): void {
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

        // Store the region we just saved into our local storage.
        this.game.storage.setRegionData(data, region);
    }

    /**
     * Iterates through the raw tileset data from the map parser. The key
     * of the raw tileset data is the tileset id, and the value is the
     * firstGID. Because loading tilesets occurs asynchronously, we need
     * to keep track of how many tilesets we've loaded. Once the tilesets
     * loaded match the number of raw tilesets, we can then toggle the
     * `tilesetsLoaded` flag so that the map can be loaded (see `ready` function).
     */

    private loadTilesets(): void {
        for (let key in this.rawTilesets)
            this.loadTileset(this.rawTilesets[key], parseInt(key), (tileset: TilesetInfo) => {
                this.tilesets[key] = tileset;

                // If we've loaded all the tilesets, map is now allowed to be marked as ready.
                if (Object.keys(this.tilesets).length === Object.keys(this.rawTilesets).length)
                    this.tilesetsLoaded = true;
            });
    }

    /**
     * Function responsible for loading the tilesheet into the game.
     * Due to the nature of HTML5, when we load an image, it must be
     * done so asynchronously.
     * @param firstGID FirstGID is the value of the rawTileset dictionary.
     * @param tilesetId The tileset number ID as a string.
     * @param callback Parsed client tileset of type TilesetInfo.
     */

    private loadTileset(
        firstGID: number,
        tilesetId: number,
        callback: (tileset: TilesetInfo) => void
    ): void {
        let tileset = new Image() as TilesetInfo,
            path = `/img/tilesets/tilesheet-${tilesetId + 1}.png`; // tileset path in the client.

        tileset.crossOrigin = 'Anonymous';
        tileset.path = path;
        tileset.src = path;
        tileset.firstGID = firstGID;

        // Listener for when the image has finished loading. Equivalent of `image.onload`
        tileset.addEventListener('load', () => {
            // Prevent uneven tilemaps from loading.
            if (tileset.width % this.tileSize > 0)
                throw new Error(`The tile size is malformed in the tile set: ${tileset.path}`);

            // Equivalent of firstGID + (tileset.width / this.tileSize) * (tileset.height / this.tileSize)
            tileset.lastGID = firstGID + (tileset.width * tileset.height) / this.tileSize ** 2;

            // Mark tileset as loaded.
            tileset.loaded = true;

            callback(tileset);
        });

        tileset.addEventListener('error', () => {
            throw new Error(`Could not find tile set: ${tileset.path}`);
        });

        /**
         * A fallback timeout in case the tileset image refuses to load. For some reason
         * when we try to load tilesets, the callback is not initialzied properly. This
         * causes the game to hang on the loading screen. Where it gets weirder is that
         * as long as a `console.log` is present, the callback is initialized properly.
         * This is a safety net that checks every 500ms if the tileset has loaded.
         */

        setTimeout(() => {
            if (!tileset.loaded) {
                // Recursively call this function until the tileset is loaded.
                this.loadTileset(firstGID, tilesetId, callback);

                log.debug(`Retrying to load tileset: ${tileset.path}`);
            }
        }, 500);
    }

    /**
     * Uses IndexedDB to retrieve the stored map data from the previous session(s).
     * We either receive completed data or empty region information. Once we have
     * parsed the data, we can then proceed with loading the rest of the game.
     */

    public loadRegionData(): void {
        this.game.storage.getRegionData((data) => {
            // Used for debugging purposes.
            let keys = Object.keys(data.regionData);

            if (keys.length > 0) {
                try {
                    this.loadRegions(data.regionData);
                } catch {
                    this.game.storage.clear();
                }

                this.objects = data.objects;
                this.cursorTiles = data.cursorTiles;

                this.regionsLoaded = keys.length;

                log.info(`Preloaded map data with ${keys.length} regions.`);
            }
        });
    }

    /**
     * Saves and stores information about objects and cursor tiles into the local storage.
     */

    private saveMapData(): void {
        this.game.storage.setMapData(this.objects, this.cursorTiles);
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
        if (this.isOutOfBounds(x, y)) return true;
        if (this.data[this.coordToIndex(x, y)] < 1) return true;

        return this.grid[y][x] === 1;
    }

    /**
     * Converts the x and y grid coordinate parameters into an index and checks
     * whether that index is contained within our objects array.
     * @param x The x grid coordinate we are checking.
     * @param y The y grid coordinate we are checking.
     * @returns Whether or not the x and y grid index is in our objects array.
     */

    public isObject(x: number, y: number): boolean {
        let index = this.coordToIndex(x, y);

        return this.objects.includes(index);
    }

    /**
     * Converts the x and y grid coordinate into an index and checks
     * our cursor tiles dictionary for an entry of the index. If it's not
     * found, it returns undefined by default.
     * @param x The x grid coordinate we are checking.
     * @param y The y grid coordinate we are checking.
     * @returns The name of the cursor at the tile index if exists, otherwise undefined.
     */

    public getTileCursor(x: number, y: number): string {
        let index = this.coordToIndex(x, y);

        return this.cursorTiles[index];
    }

    /**
     * Checks if the tileId parameter is part of our high tiles array.
     * @param tileId The tileId we are checking.
     * @returns Whether the tileId is contained in our high tiles array.
     */

    public isHighTile(tileId: number): boolean {
        return this.high.includes(tileId);
    }

    /**
     * Checks if the tileId parameter is part of our lights array.
     * @param tileId The tileId we are checking.
     * @returns Whether or not the tileId is contained in our lights array.
     */

    public isLightTile(tileId: number): boolean {
        return this.lights.includes(tileId);
    }

    /**
     * Checks if there's an entry for the tileId in our animations dictionary.
     * @param tileId The tileId we are checking animations of.
     * @returns Whether the tileId is contained in our animations dictionary.
     */

    public isAnimatedTile(tileId: number): boolean {
        return tileId in this.animatedTiles;
    }

    /**
     * Cached data is represented by the amount of regions loaded.
     * @returns Whether or not the amount of regions loaded is greater than 0.
     */

    public hasCachedDate(): boolean {
        return this.regionsLoaded > 0;
    }

    /**
     * Verifies if x and y are integers and whether or not they are within the bounds of
     * the map. That is, whether x and y are not smaller than 0, and no greater than the
     * width and height of the map respectively.
     * @param x The x grid coordinate we are checking.
     * @param y The y grid coordinate we are checking.
     * @returns Whether or not the x and y grid coordinates are within the bounds of the map.
     */

    public isOutOfBounds(x: number, y: number): boolean {
        return isInt(x) && isInt(y) && (x < 0 || x >= this.width || y < 0 || y >= this.height);
    }

    /**
     * Grabs an array of animated tile information based on tileId.
     * @param tileId THe tileId we are looking for.
     * @returns A ProcessedAnimation object array from our animated tiles.
     */

    public getTileAnimation(tileId: number): ProcessedAnimation[] {
        return this.animatedTiles[tileId];
    }

    /**
     * Finds the tileset that the tileId belongs to.
     * @param tileId The tileId we are trying to determine tileset of.
     * @returns The tileset of the tileId if found or otherwise undefined.
     */

    public getTilesetFromId(tileId: number): TilesetInfo | undefined {
        for (let index in this.tilesets)
            if (tileId < this.tilesets[index].lastGID) return this.tilesets[index];

        return undefined;
    }
    /**
     * Callback for when the map is ready to be used (preliminary data is loaded).
     */

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }
}
