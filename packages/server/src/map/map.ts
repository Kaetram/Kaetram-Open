import _ from 'lodash';

import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import mapData from '../../data/map/world.json';
import Spawns from '../../data/spawns.json';
import Items from '../util/items';
import Mobs from '../util/mobs';
import NPCs from '../util/npcs';
import Objects from '../util/objects';
import AreasIndex from './areas';
import Grids from './grids';
import Regions from './regions';

import type {
    ProcessedArea,
    ProcessedMap,
    ProcessedTileset,
    Rock,
    Tree
} from '@kaetram/common/types/map';
import type Entity from '../game/entity/entity';
import type World from '../game/world';
import type Area from './areas/area';
import type Areas from './areas/areas';

let map = mapData as ProcessedMap;

interface Door {
    x: number;
    y: number;
    orientation: number | undefined;
}

type RotatedTile = { tileId: number; h: boolean; v: boolean; d: boolean }; //horizontal, vertical, diagonal
export type AnimatedTile = { tileId: string; name: string };
export type ParsedTile = Tile | RotatedTile | RotatedTile[];
export type Tile = number | number[];
export type Position = { x: number; y: number };

type EntityType = 'mob' | 'npc' | 'item' | null;

export default class Map {
    private ready = false;

    public regions;
    public grids;

    // Map versioning and information
    public version = map.version;
    public width = map.width;
    public height = map.height;
    public tileSize = map.tileSize;

    // Map data and collisions
    public data: (number | number[])[] = map.data;
    public collisions!: number[];
    public high!: number[];
    public chests!: ProcessedArea[];
    public tilesets!: ProcessedTileset[];
    public lights!: ProcessedArea[];
    public plateau!: { [index: number]: number };
    public objects!: number[];
    public cursors!: { [tileId: number]: string };
    public doors!: { [index: number]: Door };
    public warps!: ProcessedArea[];

    public trees!: {
        [tileId: number]: Tree;
    };
    public treeIndexes!: number[];

    public rocks!: { [tileId: number]: Rock };
    public rockIndexes!: number[];

    public regionWidth!: number;
    public regionHeight!: number;

    private areas!: { [name: string]: Areas };

    public staticEntities!: {
        tileIndex: number;
        string: string;
        roaming: boolean;
        achievementId?: number | undefined;
        boss?: boolean | undefined;
        miniboss?: boolean | undefined;
        type: EntityType;
    }[];

    private checksum!: string;

    private readyInterval!: NodeJS.Timeout | null;
    private readyCallback?(): void;

    public constructor(public world: World) {
        this.load();

        this.regions = new Regions(this);
        this.grids = new Grids(this);
    }

    load(): void {
        this.version = map.version || 0;

        this.collisions = map.collisions;
        this.high = map.high;
        this.chests = map.areas.chest;

        this.loadStaticEntities();

        this.tilesets = map.tilesets;
        this.lights = map.areas.lights;
        this.plateau = map.plateau;
        this.objects = map.objects;
        this.cursors = map.cursors;
        this.warps = map.areas.warps;

        // Lumberjacking
        this.trees = map.trees;
        this.treeIndexes = map.treeIndexes;

        // Mining
        this.rocks = map.rocks;
        this.rockIndexes = map.rockIndexes;

        /**
         * These are temporarily hardcoded,
         * but we will use a dynamic approach.
         */
        this.regionWidth = 35;
        this.regionHeight = 25;

        this.checksum = Utils.getChecksum(JSON.stringify(map));

        this.areas = {};

        this.loadAreas();
        this.loadDoors();

        this.ready = true;

        if (this.world.ready) return;

        this.readyInterval = setInterval(() => {
            this.readyCallback?.();

            if (this.readyInterval) clearInterval(this.readyInterval);
            this.readyInterval = null;
        }, 75);
    }

    private loadAreas(): void {
        _.each(map.areas, (area, key: string) => {
            if (!(key in AreasIndex)) return;

            this.areas[key] = new AreasIndex[key as keyof typeof AreasIndex](area, this.world);
        });
    }

    private loadDoors(): void {
        this.doors = {};

        _.each(map.areas.doors, (door) => {
            if (!door.destination) return;

            // let orientation: Modules.Orientation;

            // switch (door.orientation) {
            //     case 'u':
            //         orientation = Modules.Orientation.Up;
            //         break;

            //     case 'd':
            //         orientation = Modules.Orientation.Down;
            //         break;

            //     case 'l':
            //         orientation = Modules.Orientation.Left;
            //         break;

            //     case 'r':
            //         orientation = Modules.Orientation.Right;
            //         break;
            // }

            let index = this.coordToIndex(door.x, door.y),
                destination = this.getDoorDestination(door);

            if (!destination) return;

            this.doors[index] = {
                x: destination.x,
                y: destination.y,
                orientation: destination.orientation
            };
        });
    }

    private loadStaticEntities(): void {
        this.staticEntities = [];

        // Legacy static entities (from Tiled);
        _.each(map.staticEntities, (entity, tileIndex) => {
            let e = {
                tileIndex: parseInt(tileIndex),
                string: entity.type,
                roaming: entity.roaming,
                type: this.getEntityType(entity.type)
            };

            this.staticEntities.push(e);
        });

        _.each(Spawns, (data) => {
            let tileIndex = this.coordToIndex(data.x, data.y);

            this.staticEntities.push({
                tileIndex,
                string: data.string,
                roaming: data.roaming,
                miniboss: data.miniboss,
                achievementId: data.achievementId,
                boss: data.boss,
                type: this.getEntityType(data.string)
            });
        });
    }

    private getEntityType(string: string): EntityType {
        if (string in Mobs.Properties) return 'mob';
        if (string in NPCs.Properties) return 'npc';
        if (string in Items.Data) return 'item';

        return null;
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

    public indexToCoord(index: number, absolute = false): Position {
        return {
            x: (index % this.width) * (!absolute ? 1 : this.tileSize),
            y: Math.floor(index / this.width) * (!absolute ? 1 : this.tileSize)
        };
    }

    private getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    private getRandomPosition(area: Area): Pos {
        let pos = {} as Pos,
            valid = false;

        while (!valid) {
            pos.x = area.x + Utils.randomInt(0, area.width + 1);
            pos.y = area.y + Utils.randomInt(0, area.height + 1);
            valid = this.isValidPosition(pos.x, pos.y);
        }

        return pos;
    }

    private inArea(
        posX: number,
        posY: number,
        x: number,
        y: number,
        width: number,
        height: number
    ): boolean {
        return posX >= x && posY >= y && posX <= width + x && posY <= height + y;
    }

    public inTutorialArea(entity: Entity): boolean {
        if (entity.x === -1 || entity.y === -1) return true;

        return (
            this.inArea(entity.x, entity.y, 370, 36, 10, 10) ||
            this.inArea(entity.x, entity.y, 312, 11, 25, 22) ||
            this.inArea(entity.x, entity.y, 399, 18, 20, 15)
        );
    }

    public nearLight(light: ProcessedArea, x: number, y: number): boolean {
        let diff = Math.round(light.distance! / 16),
            startX = light.x - this.regionWidth - diff,
            startY = light.y - this.regionHeight - diff,
            endX = light.x + this.regionWidth + diff,
            endY = light.y + this.regionHeight + diff;

        return x > startX && y > startY && x < endX && y < endY;
    }

    public isObject(object: number): boolean {
        return this.objects.includes(object);
    }

    public getPositionObject(x: number, y: number): number {
        let index = this.coordToIndex(x, y),
            tiles = this.data[index],
            objectId!: number;

        if (Array.isArray(tiles)) {
            for (let i in tiles) if (this.isObject(tiles[i])) objectId = tiles[i];
        } else if (this.isObject(tiles)) objectId = tiles;

        return objectId;
    }

    public getCursor(tileIndex: number, tileId: number): string | undefined {
        if (tileId in this.cursors) return this.cursors[tileId];

        let cursor = Objects.getCursor(this.getObjectId(tileIndex));

        if (!cursor) return;

        return cursor;
    }

    private getObjectId(tileIndex: number): string {
        let position = this.indexToCoord(tileIndex + 1);

        return `${position.x}-${position.y}`;
    }

    private getObject(
        x: number,
        y: number,
        data: { [id: number]: string }
    ): number | number[] | undefined {
        let index = this.coordToIndex(x, y),
            tiles = this.data[index];

        if (Array.isArray(tiles)) for (let i in tiles) if (tiles[i] in data) return tiles[i];

        if ((tiles as number) in data) return tiles;
    }

    public getTree(x: number, y: number): number | number[] | undefined {
        return this.getObject(x, y, this.trees);
    }

    public getRock(x: number, y: number): number | number[] | undefined {
        return this.getObject(x, y, this.rocks);
    }

    // Transforms an object's `instance` or `id` into position
    public idToPosition(id: string): Pos {
        let split = id.split('-');

        return { x: parseInt(split[0]), y: parseInt(split[1]) };
    }

    public isDoor(x: number, y: number): boolean {
        return !!this.doors[this.coordToIndex(x, y)];
    }

    public getDoorByPosition(x: number, y: number): Door {
        return this.doors[this.coordToIndex(x, y)];
    }

    private getDoorDestination(door: ProcessedArea): ProcessedArea | null {
        for (let i in map.areas.doors)
            if (map.areas.doors[i].id === door.destination) return map.areas.doors[i];

        return null;
    }

    private isValidPosition(x: number, y: number): boolean {
        return (
            Number.isInteger(x) &&
            Number.isInteger(y) &&
            !this.isOutOfBounds(x, y) &&
            !this.isColliding(x, y)
        );
    }

    public isOutOfBounds(x: number, y: number): boolean {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    private isPlateau(index: number): boolean {
        return index in this.plateau;
    }

    public isColliding(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y)) return false;

        let tileIndex = this.coordToIndex(x, y);

        return this.collisions.includes(tileIndex);
    }

    /* For preventing NPCs from roaming in null areas. */
    public isEmpty(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y)) return true;

        let tileIndex = this.coordToIndex(x, y);

        return this.data[tileIndex] === 0;
    }

    public getPlateauLevel(x: number, y: number): number {
        let index = this.coordToIndex(x, y);

        if (!this.isPlateau(index)) return 0;

        return this.plateau[index];
    }

    private getActualTileIndex(tileIndex: number): number | undefined {
        let tileset = this.getTileset(tileIndex);

        if (!tileset) return;

        return tileIndex - tileset.firstGID - 1;
    }

    private getTileset(tileIndex: number): ProcessedTileset | null {
        for (let id in this.tilesets)
            if (
                Object.prototype.hasOwnProperty.call(this.tilesets, id) &&
                tileIndex > this.tilesets[id].firstGID - 1 &&
                tileIndex < this.tilesets[id].lastGID + 1
            )
                return this.tilesets[id];

        return null;
    }

    public getWarpById(id: number): ProcessedArea | undefined {
        let warpName = Object.keys(Modules.Warps)[id];

        if (!warpName) return;

        let warp = this.getWarpByName(warpName.toLowerCase());

        if (!warp) return;

        warp.name = warpName;

        return warp;
    }

    private getWarpByName(name: string): ProcessedArea | null {
        console.log(this.warps);

        for (let i in this.warps)
            if (this.warps[i].name === name) return _.cloneDeep(this.warps[i]);

        return null;
    }

    public getChestAreas(): Areas {
        return this.areas.chests;
    }

    public isReady(callback: () => void): void {
        this.readyCallback = callback;
    }

    public forEachAreas(callback: (areas: Areas, key: string) => void): void {
        _.each(this.areas, (a: Areas, name: string) => {
            callback(a, name);
        });
    }
}
