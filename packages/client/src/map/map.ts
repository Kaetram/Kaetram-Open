import Grids from './grids';

import log from '../lib/log';
import mapData from '../../data/maps/map.json';
import Utils, { isInt } from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type Game from '../game';
import type {
    ClientTile,
    ProcessedAnimation,
    ProcessedTileset,
    RegionData,
    RegionTileData,
    Tile,
    TransformedTile
} from '@kaetram/common/types/map';

export interface CursorTiles {
    [tileId: number]: string;
}

// An extension of image with tileset information attached.
interface TilesetInfo extends HTMLImageElement {
    index: number;
    path: string;
    firstGid: number;
    lastGid: number;
    loaded: boolean;
}

export default class Map {
    public width = mapData.width;
    public height = mapData.height;
    public tileSize = mapData.tileSize;

    // Map data
    public data: ClientTile[] = [];
    public grid: number[][] = []; // Two dimensional grid array for collisions/pathing

    private high: number[] = mapData.high;
    private objects: number[] = [];
    private lights: number[] = [];

    public tilesets: TilesetInfo[] = [];
    private rawTilesets: ProcessedTileset[] = mapData.tilesets; // Key is tileset id, value is the firstGID
    private cursorTiles: CursorTiles = {};

    private animatedTiles: { [tileId: number]: ProcessedAnimation[] } = mapData.animations;
    public dynamicAnimatedTiles: { [index: number]: ClientTile } = {};

    public grids: Grids;

    public mapLoaded = false;
    public regionsLoaded = 0;
    private tilesetsLoaded = false;

    private readyCallback?(): void;

    public constructor(private game: Game) {
        this.grids = new Grids(this);

        // Load the empty grid data without webworkers if we're on iOS.
        this.loadGrid();

        this.loadTilesets();
        this.loadRegionData();

        this.ready();

        // Store tile size globally into the utils.
        Utils.tileSize = this.tileSize;
        Utils.sideLength = this.width / Modules.Constants.MAP_DIVISION_SIZE;
        Utils.halfTile = this.tileSize / 2;
        Utils.tileAndAQuarter = this.tileSize * 1.25;
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
     * Initializes the collision, map data, and rendering grid. The data grid is used
     * for rendering tiles, and the collision grid for determining which
     * tile is a collision.
     */

    private loadGrid(): void {
        let time = Date.now();

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            this.grids.renderingGrid[y] = [];

            // Initialize collision grid.
            for (let x = 0; x < this.width; x++) {
                this.data.push(0);
                this.grid[y][x] = 1;
                this.grids.renderingGrid[y][x] = {};
            }
        }

        log.debug(`Loaded empty grid in ${Date.now() - time}ms.`);

        this.mapLoaded = true;
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

        // Bind the tile layer textures after we finish parsing the map.
        if (this.game.useWebGl) this.game.renderer.bindTileLayers();
    }

    /**
     * Loads data from all the tiles in the specified region.
     * Each tile contains the x and y grid coordinate, along with information
     * about tileIds, collisions, cursor, and objects.
     * @param data Array of RegionTileData containing the data to load.
     */

    public loadRegion(data: RegionTileData[], region: number): void {
        for (let tile of data) this.loadRegionTileData(tile);

        // Store the region we just saved into our local storage.
        this.game.storage.setRegionData(data, region);
    }

    /**
     * Parses through a specified tile within the region information and extracts all
     * the necessary information into its respective array/dictionary.
     * @param tile The tile that we want to parse.
     */

    private loadRegionTileData(tile: RegionTileData): void {
        let index = this.coordToIndex(tile.x, tile.y),
            objectIndex = this.objects.indexOf(index),
            useAnimationData = !(index in this.dynamicAnimatedTiles) && !this.game.isLowPowerMode(),
            tileData = this.parseTileData(tile.data),
            animationData = tile.animation ? this.parseTileData(tile.animation) : undefined;

        /**
         * If we're in low power mode just store the tile data as is. Otherwise we store
         * the animated data if specified and default to the data if not.
         */
        this.data[index] = useAnimationData ? animationData || tileData : tileData;

        // If the tile contains an animation flag, we store it in the dynamic animated tiles dictionary.
        if (animationData) this.dynamicAnimatedTiles[index] = tileData;

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

        // Add the tile information to the WebGL renderer if it's active.
        if (this.game.useWebGl) this.game.renderer.setTile(index, this.data[index]);
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
        for (let index in this.rawTilesets)
            this.loadTileset(this.rawTilesets[index], parseInt(index), (tileset: TilesetInfo) => {
                // Prevent adding the tileset if it already exists.
                for (let set of this.tilesets) if (set.src === tileset.src) return;

                this.tilesets.push(tileset);

                if (this.tilesets.length === this.rawTilesets.length) {
                    // Sort tilesets by first gid.
                    this.tilesets = this.tilesets.sort((a, b) => a.firstGid - b.firstGid);

                    this.tilesetsLoaded = true;
                }
            });
    }

    /**
     * Handles loading the image for a tileset. Once the image has been loaded
     * we invoke the callbakc function with the information about the new tileset.
     * @param tileset Raw tileset data parsed from the map.
     * @param callback Parsed client tileset of type TilesetInfo.
     */

    private loadTileset(
        tileset: ProcessedTileset,
        index: number,
        callback: (tileset: TilesetInfo) => void
    ): void {
        let tilesetInfo = new Image() as TilesetInfo,
            path = `/img/tilesets/${tileset.relativePath}`; // tileset path in the client.

        tilesetInfo.crossOrigin = 'Anonymous';
        tilesetInfo.path = path;
        tilesetInfo.src = path;
        tilesetInfo.index = index;
        tilesetInfo.firstGid = tileset.firstGid;
        tilesetInfo.lastGid = tileset.lastGid;

        // Listener for when the image has finished loading. Equivalent of `image.onload`
        tilesetInfo.addEventListener('load', () => {
            // Prevent uneven tilemaps from loading.
            if (tilesetInfo.width % this.tileSize > 0)
                log.error(`The tile size is malformed in the tile set: ${tileset.path}`);

            // Mark tileset as loaded.
            tilesetInfo.loaded = true;

            callback(tilesetInfo);
        });

        tilesetInfo.addEventListener('error', () => {
            log.error(`Could not find tile set: ${tileset.path}`);
        });

        /**
         * A fallback timeout in case the tileset image refuses to load. For some reason
         * when we try to load tilesets, the callback is not initialzied properly. This
         * causes the game to hang on the loading screen. Where it gets weirder is that
         * as long as a `console.log` is present, the callback is initialized properly.
         * This is a safety net that checks every 500ms if the tileset has loaded.
         */

        setTimeout(() => {
            if (tilesetInfo.loaded) return;

            // Recursively call this function until the tileset is loaded.
            this.loadTileset(tileset, index, callback);

            log.debug(`Retrying to load tileset: ${tileset.path}`);
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
                    this.game.storage.clearIndexedDB();
                }

                this.objects = data.objects;
                this.cursorTiles = data.cursorTiles;

                this.regionsLoaded = keys.length;

                log.debug(`Preloaded map data with ${keys.length} regions.`);
            }
        });
    }

    /**
     * Given a raw tile received from a server at an index, we try to extract the information
     * from it and determine if it contains and flipped flags. We create a new array (or single
     * variable if the original data is not an array).
     * @param data The raw tile data, may be a single number or an array of numbers.
     * @returns A processed client tile object.
     */

    public parseTileData(data: Tile): ClientTile {
        let isArray = Array.isArray(data),
            parsedData: ClientTile = isArray ? [] : 0;

        this.forEachTile(data, (tileId: number) => {
            let tile: number | TransformedTile = tileId;

            if (this.isFlippedTileId(tileId)) tile = this.getFlippedTile(tileId);

            if (isArray) (parsedData as unknown[]).push(tile);
            else parsedData = tile;
        });

        return parsedData;
    }

    /**
     * Uses a rotated tile which contains the flip flags bitshifted onto it and undoes
     * the bitshift to retrieve the original tileId. This is used for retrieving the
     * original tileId from a flipped tile. We also store each flag of the transformations
     * and apply them onto a TransformedTile object.
     * For more information refer to the following
     * https://doc.mapeditor.org/en/stable/reference/tmx-map-format/#tmx-tile-flipping
     * @param tileId The tileId of the flipped tile.
     * @returns A parsed tile of type `RotatedTile`.
     */

    public getFlippedTile(tileId: number): TransformedTile {
        let h = !!(tileId & Modules.MapFlags.HORIZONTAL_FLAG),
            v = !!(tileId & Modules.MapFlags.VERTICAL_FLAG),
            d = !!(tileId & Modules.MapFlags.DIAGONAL_FLAG);

        tileId &= ~(
            Modules.MapFlags.DIAGONAL_FLAG |
            Modules.MapFlags.VERTICAL_FLAG |
            Modules.MapFlags.HORIZONTAL_FLAG
        );

        return {
            tileId,
            h,
            v,
            d
        };
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
            y: ~~(index / this.width)
        };
    }

    /**
     * Checks if a coordinate in the grid collision is
     * marked as a collision.
     * @param x The x grid coordinate.
     * @param y The y grid coordinate.
     * @param all Whether to include additional collisions.
     * @returns Whether the x and y coordinates in the 2D grid are colliding.
     */

    public isColliding(x: number, y: number, all = false): boolean {
        if (this.isOutOfBounds(x, y)) return true;
        if ((this.data[this.coordToIndex(x, y)] as number) < 1) return true;

        return this.grid[y][x] === 1 || (all && this.grid[y][x] === 2);
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
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    /**
     * A flipped tile is any tile that contains a flip flag or transpose flag.
     * @param tile Tile data received from the server.
     * @returns Whether or not the tile contains and flip flags.
     */

    public isFlipped(tile: ClientTile): tile is TransformedTile {
        return (
            (tile as TransformedTile).v ||
            (tile as TransformedTile).h ||
            (tile as TransformedTile).d
        );
    }

    /**
     * Checks whether a tileId is flipped or not by comparing
     * the value against the lowest flipped bitflag.
     * @param tileId The tileId we are checking.
     */

    public isFlippedTileId(tileId: number): boolean {
        return tileId > (Modules.MapFlags.DIAGONAL_FLAG as number);
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
        for (let tileset of this.tilesets)
            if (tileId >= tileset.firstGid && tileId <= tileset.lastGid) return tileset;

        return undefined;
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
     * Callback for when the map is ready to be used (preliminary data is loaded).
     */

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }

    /**
     * Iterates through all the tiles at a given index if it's an array, otherwise we just return
     * the number contained at that location. This is used to speed up code when trying to handle
     * logic for multiple tiles at a location.
     * @param data The raw tile data (generally contained in the umodified map) at an index.
     * @param callback The tile id and index of the tile currently being iterated.
     */

    public forEachTile(data: Tile, callback: (tileId: number, index?: number) => void): void {
        if (Array.isArray(data)) for (let index in data) callback(data[index], parseInt(index));
        else callback(data);
    }
}
