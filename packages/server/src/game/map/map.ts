import AreasIndex from './areas';
import Grids from './grids';
import Regions from './regions';

import mapData from '../../../data/map/world.json';

import { Modules } from '@kaetram/common/network';

import type {
    FlatTile,
    ProcessedArea,
    ProcessedDoor,
    ProcessedMap,
    ProcessedResource,
    RegionTile,
    RotatedTile,
    Tile
} from '@kaetram/common/types/map';
import type Player from '../entity/character/player/player';
import type World from '../world';
import type Areas from './areas/areas';

let map = mapData as ProcessedMap;

export default class Map {
    // Map versioning and information
    public version = map.version;
    public width = map.width;
    public height = map.height;
    public tileSize = map.tileSize;

    // Map handlers
    public regions: Regions;
    public grids: Grids = new Grids(this.width, this.height);

    // Map data and collisions
    public data: (number | number[])[] = map.data;
    private collisions: number[] = map.collisions || [];
    private entities: { [tileId: number]: string } = map.entities;

    public plateau: { [index: number]: number } = map.plateau;
    public objects: number[] = map.objects;
    public cursors: { [tileId: number]: string } = map.cursors;
    public doors: { [index: number]: ProcessedDoor } = {};
    public warps: ProcessedArea[] = map.areas.warps || [];
    public trees: ProcessedResource[] = map.trees || [];
    public rocks: ProcessedResource[] = map.rocks || [];
    public lights: ProcessedArea[] = map.areas.lights || [];
    public signs: ProcessedArea[] = map.areas.signs || [];

    // Static chest areas, named as singular to prevent confusion with `chests` area.
    public chest: ProcessedArea[] = map.areas.chest || [];

    private areas: { [name: string]: Areas } = {};

    public constructor(public world: World) {
        this.loadAreas();
        this.loadDoors();

        this.regions = new Regions(this);
    }

    /**
     * Iterates through the static areas and incorporates
     * them into the server by creating instances of them.
     * This allows them to be manipulated and interacted with.
     */

    private loadAreas(): void {
        for (let key in map.areas) {
            if (!(key in AreasIndex)) continue;

            this.areas[key] = new AreasIndex[key as keyof typeof AreasIndex](
                map.areas[key],
                this.world
            );
        }
    }

    /**
     * Iterates through the doors saved in the static map
     * and links them together. We create a clone of all the
     * doors due to the pointer properties of JavaScript.
     * We link each door with their respective destination,
     * and return a list of all doors (ensuring it is not circular).
     * Doors are a dictionary, where the index represents the tileIndex
     * of the door the player goes through, and the value represents
     * the destination information.
     */

    private loadDoors(): void {
        let doorsClone = map.areas.doors.map((door) => ({ ...door }));

        // Iterate through the doors in the map.
        for (let door of map.areas.doors) {
            // Skip if the door does not have a destination.
            if (!door.destination) continue;

            // Find destination door in the clone list of doors.
            let index = this.coordToIndex(door.x, door.y),
                destination = doorsClone.find((cloneDoor) => {
                    return door.destination === cloneDoor.id;
                });

            if (!destination) continue;

            // Assign destination door information to the door we are parsing.
            this.doors[index] = {
                x: destination.x,
                y: destination.y,
                orientation: destination.orientation || 'd',
                quest: door.quest || '',
                achievement: door.achievement || '',
                reqAchievement: door.reqAchievement || '',
                reqQuest: door.reqQuest || '',
                reqItem: door.reqItem || '',
                reqItemCount: door.reqItemCount || 0,
                stage: door.stage || 0,
                level: door.level || 0
            };
        }
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
     * Checks whether a tileId is flipped or not by comparing
     * the value against the lowest flipped bitflag.
     * @param tileId The tileId we are checking.
     */

    public isFlipped(tileId: number): boolean {
        return tileId > Modules.MapFlags.DIAGONAL_FLAG;
    }

    /**
     * Grabs the x and y cooridnates specified and checks
     * the tileIndex against the array of doors in the world.
     * @param x The grid x coordinate we are checking.
     * @param y The grid y coordinate we are checking.
     * @returns Boolean on whether or not the door exists.
     */

    public isDoor(x: number, y: number): boolean {
        return !!this.doors[this.coordToIndex(x, y)];
    }

    /**
     * Checks if the specified `x` and `y` coordinates are outside
     * the map bounds.
     * @param x Grid x coordinate we are checking.
     * @param y Grid y coordinate we are checking.
     * @returns Whether or not the x and y grid coordinates are within the bounds.
     */

    public isOutOfBounds(x: number, y: number): boolean {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    /**
     * Checks if the tileIndex exists in the map collisions.
     * @param index Tile index to check.
     * @returns If the array of collision indexes contains the tileIndex.
     */

    public isCollisionIndex(index: number): boolean {
        return this.collisions.includes(index);
    }

    /**
     * Checks if a position is a collision. Checks the tileIndex against
     * the array of collision indexes and verifies that the tile is not null.
     * @param x Grid x coordinate we are checking.
     * @param y Grid y coordinate we are checking.
     * @param player Optional parameter used to check the dynamic tile collision.
     * @returns True if the position is a collision.
     */

    public isColliding(x: number, y: number, player?: Player): boolean {
        if (this.isOutOfBounds(x, y)) return true;

        /**
         * This is the cleanest way I could've done dynamic collision detection.
         * It checks whether the player exists, region has valid dynamic areas,
         * and if we can find the mapped tile. If any of those fail, the if statement
         * nest will exit and check collisions against the static map.
         */

        // Verify dynamic tile collision if player is provided as a parameter.
        if (player) {
            let region = this.regions.get(this.regions.getRegion(x, y));

            // Skip if there are no dynamic areas in the region.
            if (region.hasDynamicAreas()) {
                let dynamicArea = region.getDynamicArea(x, y);

                // Skip if no dynamic area is found or it doesn't fulfill requirements.
                if (dynamicArea?.fulfillsRequirement(player)) {
                    let mappedTile = dynamicArea.getMappedTile(x, y);

                    // Check collision if we can find a mapping tile.
                    if (mappedTile) return this.isColliding(mappedTile.x, mappedTile.y);
                }
            }
        }

        let index = this.coordToIndex(x, y);

        // If the tile is empty it's automatically a collision tile.
        return !this.data[index] || this.isCollisionIndex(index);
    }

    /**
     * Checks if the tile data (at an index) is an object.
     * @param data The tile data (number or number array) we are checking.
     * @returns Boolean conditional if the tile data contains an object.
     */

    public isObject(data: Tile): boolean {
        let isObject = false;

        this.forEachTile(data, (tileId: number) => {
            if (this.objects.includes(tileId)) isObject = true;
        });

        return isObject;
    }

    /**
     * Grabs the chest areas group parsed in the map.
     * @returns The chests areas parsed upon loading.
     */

    public getChestAreas(): Areas {
        return this.areas.chests;
    }

    /**
     * Grabs the dynamic areas group parsed in the map.
     * @returns The dynamic areas parsed upon loading.
     */

    public getDynamicAreas(): Areas {
        return this.areas.dynamic;
    }

    /**
     * Grabs the minigame areas in the map.
     * @returns The minigame areas parsed upon loading.
     */

    public getMinigameAreas(): Areas {
        return this.areas.minigame;
    }

    /**
     * Converts the coordinate x and y into a tileIndex
     * and returns a door at the index. Defaults to undefined
     * if no door is found.
     * @param x The grid x coordinate we are checking.
     * @param y The grid y coordinate we are checking.
     * @returns ProcessedDoor object if it exists in the door array.
     */

    public getDoor(x: number, y: number): ProcessedDoor {
        return this.doors[this.coordToIndex(x, y)];
    }

    /**
     * Looks for cursor data in the provided tile data. The tile data
     * is directly extracted from the map data at a certain index.
     * @param data The tile data we are checking.
     * @returns The cursor name if it exists.
     */

    public getCursor(data: Tile): string {
        let cursor = '';

        this.forEachTile(data, (tileId: number) => {
            if (tileId in this.cursors) cursor = this.cursors[tileId];
        });

        return cursor;
    }

    /**
     * Converts the tileIndex into a position object and returns
     * a string formatted version of the coordinate.
     * @param tileIndex The index we are converting to a position.
     * @returns A string of the x and y coordinate.
     */

    private getObjectId(tileIndex: number): string {
        let position = this.indexToCoord(tileIndex);

        return `${position.x}-${position.y}`;
    }

    /**
     * Returns the current plateau level of the specified coordinates.
     * @param x Grid x coordinate we are checking.
     * @param y Grid y coordinate we are checking.
     * @returns The plateau level of the coordinate or 0 if none exists.
     */

    public getPlateauLevel(x: number, y: number): number {
        let index = this.coordToIndex(x, y);

        if (!(index in this.plateau)) return 0;

        // Plateau at the coordinate index.
        return this.plateau[index];
    }

    /**
     * Uses the index (see `coordToIndex`) to obtain tile inforamtion in the tilemap.
     * The object is a region tile that is later used to send map data to the client.
     * @param index Gets tile information at an index in the map.
     * @returns Returns tile information (a number or number array)
     */

    public getTileData(index: number): RegionTile {
        let data = this.data[index];

        return data ? this.parseTileData(data) : [];
    }

    /**
     * Parses through the specified data at a given index and extracts
     * the flipped tiles from it. Returns a formatted RegionTile ready for
     * the client.
     * @param data Raw data contained at an index.
     * @returns A RegionTile object containing index tile data information.
     */

    public parseTileData(data: Tile): RegionTile {
        let isArray = Array.isArray(data),
            parsedData: RegionTile = isArray ? [] : 0;

        this.forEachTile(data, (tileId: number) => {
            let tile: RegionTile = tileId;

            if (this.isFlipped(tileId)) tile = this.getFlippedTile(tileId);

            if (isArray) (parsedData as FlatTile).push(tile);
            else parsedData = tile;
        });

        return parsedData;
    }

    /**
     * Grabs the rotated tile id from Tiled and performs bitwise operators
     * on it in order to convert it to an actual tileId. The bitshifts
     * indicate the type of rotation, and performing all the operations
     * results in the original tileId.
     * For more information refer to the following
     * https://doc.mapeditor.org/en/stable/reference/tmx-map-format/#tmx-tile-flipping
     * @param tileId The tileId of the flipped tile.
     * @returns A parsed tile of type `RotatedTile`.
     */

    public getFlippedTile(tileId: number): RotatedTile {
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
     * A callback function used to iterate through all the areas in the map.
     * Specifically used in the player's handler, it is used to check
     * various activities within the areas.
     * @param callback Returns an areas group (i.e. chest areas) and the key of the group.
     * @param list Optional parameter used for iterating through specified areas. Prevents iterating
     * through unnecessary areas.
     */

    public forEachAreas(callback: (areas: Areas, key: string) => void, list: string[] = []): void {
        for (let name in this.areas) {
            if (list.length > 0 && !list.includes(name)) continue;

            callback(this.areas[name], name);
        }
    }

    /**
     * Tile data consists of arrays and single numerical values.
     * This callback function is used to cleanly iterate through
     * those Tile[] arrays. i.e. [1, 2, [1, 2, 3], 4, [5, 6]]
     */

    public forEachTile(data: Tile, callback: (tileId: number, index?: number) => void): void {
        if (Array.isArray(data)) for (let index in data) callback(data[index], parseInt(index));
        else callback(data);
    }

    /**
     * Parses through the entities in the raw map data and converts data for the controller.
     * @param callback The position of the entity and its string id.
     */

    public forEachEntity(callback: (position: Position, key: string) => void): void {
        for (let tileId in this.entities) {
            let position = this.indexToCoord(parseInt(tileId));

            callback(position, this.entities[tileId]);
        }
    }
}
