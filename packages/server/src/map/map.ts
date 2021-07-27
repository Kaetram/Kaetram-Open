import _ from 'lodash';

import * as Modules from '@kaetram/common/src/modules';

import mapData from '../../data/map/world.json';
import Spawns from '../../data/spawns.json';
import Entity from '../game/entity/entity';
import World from '../game/world';
import Items from '../util/items';
import Mobs from '../util/mobs';
import NPCs from '../util/npcs';
import Objects from '../util/objects';
import Utils from '../util/utils';
import AreasIndex from './areas';
import Area from './areas/area';
import Areas from './areas/areas';
import Grids from './grids';
import Regions from './regions';

import type {
    ProcessedMap,
    ProcessedArea,
    ProcessedTileset,
    Tree
} from '@kaetram/tools/map/mapdata';

const map = mapData as ProcessedMap;

interface Door {
    x: number;
    y: number;
    orientation: number;
}

export default class Map {
    world: World;
    ready: boolean;

    regions: Regions;
    grids: Grids;

    version: number;

    data: (number | number[])[];

    width: number;
    height: number;

    collisions: number[];
    tileCollisions: number[];
    high: number[];
    chests: ProcessedArea[];
    tilesets: ProcessedTileset[];
    lights: ProcessedArea[];
    plateau: { [index: number]: number };
    objects: number[];
    cursors: { [tileId: number]: string };
    doors: { [index: number]: Door };
    warps: ProcessedArea[];

    trees: {
        [tileId: number]: Tree;
    };
    treeIndexes: number[];

    rocks: Record<string, never>;
    rockIndexes: number[];

    regionWidth: number;
    regionHeight: number;

    areas: { [name: string]: Areas };

    staticEntities: {
        tileIndex: number;
        string: string;
        roaming: boolean;
        achievementId?: number;
        boss?: boolean;
        miniboss?: boolean;
        type: 'mob' | 'npc' | 'item';
    }[];

    checksum: string;

    readyInterval: NodeJS.Timeout;
    readyCallback?(): void;

    constructor(world: World) {
        this.world = world;

        this.ready = false;

        this.load();

        this.regions = new Regions(this);
        this.grids = new Grids(this);
    }

    load(): void {
        this.version = map.version || 0;

        this.data = map.data;

        this.width = map.width;
        this.height = map.height;
        this.collisions = map.collisions;
        this.tileCollisions = map.tileCollisions;
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
            if (this.readyCallback) this.readyCallback();

            clearInterval(this.readyInterval);
            this.readyInterval = null;
        }, 75);
    }

    loadAreas(): void {
        _.each(map.areas, (area, key: string) => {
            if (!(key in AreasIndex)) return;

            this.areas[key] = new AreasIndex[key](area, this.world);
        });
    }

    loadDoors(): void {
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

            let index = this.gridPositionToIndex(door.x, door.y, 1),
                destination = this.getDoorDestination(door);

            if (!destination) return;

            this.doors[index] = {
                x: destination.x,
                y: destination.y,
                orientation: destination.orientation
            };
        });
    }

    loadStaticEntities(): void {
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
            let tileIndex = this.gridPositionToIndex(data.x, data.y);

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

    getEntityType(string: string): 'mob' | 'npc' | 'item' {
        if (string in Mobs.Properties) return 'mob';
        if (string in NPCs.Properties) return 'npc';
        if (string in Items.Data) return 'item';

        return null;
    }

    indexToGridPosition(tileIndex: number, offset = 0): Pos {
        tileIndex -= 1;

        let x = this.getX(tileIndex + 1, this.width),
            y = Math.floor(tileIndex / this.width);

        return {
            x: x + offset,
            y
        };
    }

    gridPositionToIndex(x: number, y: number, offset = 0): number {
        return y * this.width + x + offset;
    }

    getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    getRandomPosition(area: Area): Pos {
        let pos = {} as Pos,
            valid = false;

        while (!valid) {
            pos.x = area.x + Utils.randomInt(0, area.width + 1);
            pos.y = area.y + Utils.randomInt(0, area.height + 1);
            valid = this.isValidPosition(pos.x, pos.y);
        }

        return pos;
    }

    inArea(
        posX: number,
        posY: number,
        x: number,
        y: number,
        width: number,
        height: number
    ): boolean {
        return posX >= x && posY >= y && posX <= width + x && posY <= height + y;
    }

    inTutorialArea(entity: Entity): boolean {
        if (entity.x === -1 || entity.y === -1) return true;

        return (
            this.inArea(entity.x, entity.y, 370, 36, 10, 10) ||
            this.inArea(entity.x, entity.y, 312, 11, 25, 22) ||
            this.inArea(entity.x, entity.y, 399, 18, 20, 15)
        );
    }

    nearLight(light: ProcessedArea, x: number, y: number): boolean {
        let diff = Math.round(light.distance / 16),
            startX = light.x - this.regionWidth - diff,
            startY = light.y - this.regionHeight - diff,
            endX = light.x + this.regionWidth + diff,
            endY = light.y + this.regionHeight + diff;

        return x > startX && y > startY && x < endX && y < endY;
    }

    isObject(object: number): boolean {
        return this.objects.includes(object);
    }

    getPositionObject(x: number, y: number): number {
        let index = this.gridPositionToIndex(x, y),
            tiles = this.data[index],
            objectId: number;

        if (Array.isArray(tiles)) {
            for (let i in tiles) if (this.isObject(tiles[i])) objectId = tiles[i];
        } else if (this.isObject(tiles)) objectId = tiles;

        return objectId;
    }

    getCursor(tileIndex: number, tileId: number): string {
        if (tileId in this.cursors) return this.cursors[tileId];

        let cursor = Objects.getCursor(this.getObjectId(tileIndex));

        if (!cursor) return null;

        return cursor;
    }

    getObjectId(tileIndex: number): string {
        let position = this.indexToGridPosition(tileIndex + 1);

        return position.x + '-' + position.y;
    }

    getObject(x: number, y: number, data: { [id: number]: string }): number | number[] {
        let index = this.gridPositionToIndex(x, y, -1),
            tiles = this.data[index];

        if (Array.isArray(tiles)) for (let i in tiles) if (tiles[i] in data) return tiles[i];

        if ((tiles as number) in data) return tiles;

        return null;
    }

    getTree(x: number, y: number): number | number[] {
        return this.getObject(x, y, this.trees);
    }

    getRock(x: number, y: number): number | number[] {
        return this.getObject(x, y, this.rocks);
    }

    // Transforms an object's `instance` or `id` into position
    idToPosition(id: string): Pos {
        let split = id.split('-');

        return { x: parseInt(split[0]), y: parseInt(split[1]) };
    }

    isDoor(x: number, y: number): boolean {
        return !!this.doors[this.gridPositionToIndex(x, y, 1)];
    }

    getDoorByPosition(x: number, y: number): Door {
        return this.doors[this.gridPositionToIndex(x, y, 1)];
    }

    getDoorDestination(door: ProcessedArea): ProcessedArea {
        for (let i in map.areas.doors)
            if (map.areas.doors[i].id === door.destination) return map.areas.doors[i];

        return null;
    }

    isValidPosition(x: number, y: number): boolean {
        return (
            Number.isInteger(x) &&
            Number.isInteger(y) &&
            !this.isOutOfBounds(x, y) &&
            !this.isColliding(x, y)
        );
    }

    isOutOfBounds(x: number, y: number): boolean {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    isPlateau(index: number): boolean {
        return index in this.plateau;
    }

    isColliding(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y)) return false;

        let tileIndex = this.gridPositionToIndex(x, y);

        return this.collisions.includes(tileIndex);
    }

    /* For preventing NPCs from roaming in null areas. */
    isEmpty(x: number, y: number): boolean {
        if (this.isOutOfBounds(x, y)) return true;

        let tileIndex = this.gridPositionToIndex(x, y);

        return this.data[tileIndex] === 0;
    }

    getPlateauLevel(x: number, y: number): number {
        let index = this.gridPositionToIndex(x, y);

        if (!this.isPlateau(index)) return 0;

        return this.plateau[index];
    }

    getActualTileIndex(tileIndex: number): number {
        let tileset = this.getTileset(tileIndex);

        if (!tileset) return;

        return tileIndex - tileset.firstGID - 1;
    }

    getTileset(tileIndex: number): ProcessedTileset {
        for (let id in this.tilesets)
            if (
                Object.prototype.hasOwnProperty.call(this.tilesets, id) &&
                tileIndex > this.tilesets[id].firstGID - 1 &&
                tileIndex < this.tilesets[id].lastGID + 1
            )
                return this.tilesets[id];

        return null;
    }

    getWarpById(id: number): ProcessedArea {
        let warpName = Object.keys(Modules.Warps)[id];

        if (!warpName) return null;

        let warp = this.getWarpByName(warpName.toLowerCase());

        if (!warp) return;

        warp.name = warpName;

        return warp;
    }

    getWarpByName(name: string): ProcessedArea {
        console.log(this.warps);

        for (let i in this.warps)
            if (this.warps[i].name === name) return _.cloneDeep(this.warps[i]);

        return null;
    }

    getChestAreas(): Areas {
        return this.areas.chests;
    }

    isReady(callback: () => void): void {
        this.readyCallback = callback;
    }

    forEachAreas(callback: (areas: Areas, key: string) => void): void {
        _.each(this.areas, (a: Areas, name: string) => {
            callback(a, name);
        });
    }
}
