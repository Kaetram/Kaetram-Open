import fs from 'fs';
import _ from 'lodash';
import path from 'path';

import Grids from './grids';
import Regions from './regions';
import Utils from '../util/utils';
import Modules from '../util/modules';
import Objects from '../util/objects';
import World from '../game/world';
import Area from './areas/area';
import Entity from '../game/entity/entity';
import Spawns from '../../data/spawns.json';

import Areas from './areas/areas';
import AreasIndex from './areas/index';

import log from '../util/log';

let map: any;

const mapDestination = path.resolve(__dirname, '../../data/map/world.json');

class Map {
    world: World;
    ready: boolean;

    regions: Regions;
    grids: Grids;

    version: number;

    data: any[];

    width: number;
    height: number;

    collisions: any;
    chests: any;
    tilesets: any;
    lights: any;
    plateau: any;
    objects: any;
    cursors: any;
    doors: any;
    warps: any;

    trees: any;
    treeIndexes: any;

    rocks: any;
    rockIndexes: any;

    regionWidth: number;
    regionHeight: number;

    areas: any;

    staticEntities: any;

    checksum: string;

    readyInterval: any;
    readyCallback: Function;

    constructor(world: World) {
        this.world = world;

        this.ready = false;

        this.create();
        this.load();

        this.regions = new Regions(this);
        this.grids = new Grids(this);
    }

    create(jsonData?: any) {
        try {
            map = jsonData || JSON.parse(fs.readFileSync(mapDestination, {
                encoding: 'utf8',
                flag: 'r'
            }));
        } catch (e) { log.error('Could not create the map file.'); };
    }

    load() {
        this.version = map.version || 0;

        this.data = map.data;

        this.width = map.width;
        this.height = map.height;
        this.collisions = map.collisions;
        this.chests = map.chests;

        this.loadStaticEntities();

        this.tilesets = map.tilesets;
        this.lights = map.lights;
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
        this.regionWidth = 25;
        this.regionHeight = 25;

        this.checksum = Utils.getChecksum(JSON.stringify(map));

        this.areas = {};

        this.loadAreas();
        this.loadDoors();

        this.ready = true;

        if (this.world.ready)
            return;

        this.readyInterval = setInterval(() => {
            if (this.readyCallback) this.readyCallback();

            clearInterval(this.readyInterval);
            this.readyInterval = null;
        }, 75);

    }

    loadAreas() {
        _.each(map.areas, (area: any, key: string) => {
            if (!(key in AreasIndex)) return;

            this.areas[key] = new AreasIndex[key](area, this.world);
        });
    }

    loadDoors() {
        this.doors = {};

        _.each(map.areas.doors, (door: any) => {
            if (!door.destination) return;

            let orientation: number;

            switch (door.orientation) {
                case 'u':
                    orientation = Modules.Orientation.Up;
                    break;

                case 'd':
                    orientation = Modules.Orientation.Down;
                    break;

                case 'l':
                    orientation = Modules.Orientation.Left;
                    break;

                case 'r':
                    orientation = Modules.Orientation.Right;
                    break;
            }

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

    loadStaticEntities() {
        this.staticEntities = [];

        // Legacy static entities (from Tiled);
        _.each(map.staticEntities, (entity: any, tileIndex) => {
            this.staticEntities.push({
                tileIndex: tileIndex,
                string: entity.type,
                roaming: entity.roaming
            });
        });

        _.each(Spawns, (data) => {
            let tileIndex = this.gridPositionToIndex(data.x, data.y);

            this.staticEntities.push({
                tileIndex: tileIndex,
                string: data.string,
                roaming: data.roaming,
                miniboss: data.miniboss,
                achievementId: data.achievementId,
                boss: data.boss
            });
        });
    }

    indexToGridPosition(tileIndex: number) {
        tileIndex -= 1;

        let x = this.getX(tileIndex + 1, this.width),
            y = Math.floor(tileIndex / this.width);

        return {
            x: x,
            y: y
        };
    }

    gridPositionToIndex(x: number, y: number, offset: number = 0) {
        return y * this.width + x + offset;
    }

    getX(index: number, width: number) {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    getRandomPosition(area: Area) {
        let pos: any = {},
            valid = false;

        while (!valid) {
            pos.x = area.x + Utils.randomInt(0, area.width + 1);
            pos.y = area.y + Utils.randomInt(0, area.height + 1);
            valid = this.isValidPosition(pos.x, pos.y);
        }

        return pos;
    }

    inArea(posX: number, posY: number, x: number, y: number, width: number, height: number) {
        return posX >= x && posY >= y && posX <= width + x && posY <= height + y;
    }

    inTutorialArea(entity: Entity) {
        if (entity.x === -1 || entity.y === -1) return true;

        return (
            this.inArea(entity.x, entity.y, 370, 36, 10, 10) ||
            this.inArea(entity.x, entity.y, 312, 11, 25, 22) ||
            this.inArea(entity.x, entity.y, 399, 18, 20, 15)
        );
    }

    nearLight(light: any, x: number, y: number) {
        let diff = Math.round(light.distance / 16),
            startX = light.x - this.regionWidth - diff,
            startY = light.y - this.regionHeight - diff,
            endX = light.x + this.regionWidth + diff,
            endY = light.y + this.regionHeight + diff;

        return x > startX && y > startY && x < endX && y < endY;
    }

    isObject(object: any) {
        return this.objects.indexOf(object) > -1;
    }

    getPositionObject(x: number, y: number) {
        let index = this.gridPositionToIndex(x, y),
            tiles: any = this.data[index],
            objectId: any;

        if (tiles instanceof Array)
            for (let i in tiles)
                if (this.isObject(tiles[i])) objectId = tiles[i];
                else if (this.isObject(tiles)) objectId = tiles;

        return objectId;
    }

    getCursor(tileIndex: number, tileId: number) {
        if (tileId in this.cursors) return this.cursors[tileId];

        let cursor = Objects.getCursor(this.getObjectId(tileIndex));

        if (!cursor) return null;

        return cursor;
    }

    getObjectId(tileIndex: number) {
        let position = this.indexToGridPosition(tileIndex + 1);

        return position.x + '-' + position.y;
    }

    getObject(x: number, y: number, data: any) {
        let index = this.gridPositionToIndex(x, y, -1),
            tiles = this.data[index];

        if (tiles instanceof Array) for (let i in tiles) if (tiles[i] in data) return tiles[i];

        if (tiles in data) return tiles;

        return null;
    }

    getTree(x: number, y: number) {
        return this.getObject(x, y, this.trees);
    }

    getRock(x: number, y: number) {
        return this.getObject(x, y, this.rocks);
    }

    // Transforms an object's `instance` or `id` into position
    idToPosition(id: string) {
        let split = id.split('-');

        return { x: parseInt(split[0]), y: parseInt(split[1]) };
    }

    isDoor(x: number, y: number) {
        return !!this.doors[this.gridPositionToIndex(x, y, 1)];
    }

    getDoorByPosition(x: number, y: number) {
        return this.doors[this.gridPositionToIndex(x, y, 1)];
    }

    getDoorDestination(door: any) {
        for (let i in map.areas.doors)
            if (map.areas.doors[i].id === door.destination)
                return map.areas.doors[i];
                
        return null;
    }

    isValidPosition(x: number, y: number) {
        return (
            Number.isInteger(x) &&
            Number.isInteger(y) &&
            !this.isOutOfBounds(x, y) &&
            !this.isColliding(x, y)
        );
    }

    isOutOfBounds(x: number, y: number) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    isPlateau(index: number) {
        return index in this.plateau;
    }

    isColliding(x: number, y: number) {
        if (this.isOutOfBounds(x, y)) return false;

        let tileIndex = this.gridPositionToIndex(x, y);

        return this.collisions.indexOf(tileIndex) > -1;
    }

    /* For preventing NPCs from roaming in null areas. */
    isEmpty(x: number, y: number) {
        if (this.isOutOfBounds(x, y)) return true;

        let tileIndex = this.gridPositionToIndex(x, y);

        return this.data[tileIndex] === 0;
    }

    getPlateauLevel(x: number, y: number) {
        let index = this.gridPositionToIndex(x, y);

        if (!this.isPlateau(index)) return 0;

        return this.plateau[index];
    }

    getActualTileIndex(tileIndex: number) {
        let tileset = this.getTileset(tileIndex);

        if (!tileset) return;

        return tileIndex - tileset.firstGID - 1;
    }

    getTileset(tileIndex: number) {
        for (let id in this.tilesets)
            if (this.tilesets.hasOwnProperty(id))
                if (
                    tileIndex > this.tilesets[id].firstGID - 1 &&
                    tileIndex < this.tilesets[id].lastGID + 1
                )
                    return this.tilesets[id];

        return null;
    }

    getWarpById(id: number) {
        let warpName = Object.keys(Modules.Warps)[id];

        if (!warpName) return null;

        let warp = this.getWarpByName(warpName.toLowerCase());

        if (!warp) return;

        warp.name = warpName;

        return warp;
    }

    getWarpByName(name: string) {
        console.log(this.warps);

        for (let i in this.warps)
            if (this.warps[i].name === name)
                return _.cloneDeep(this.warps[i]);

        return null;
    }

    isReady(callback: Function) {
        this.readyCallback = callback;
    }

    forEachAreas(callback: (areas: Areas, key: string) => void) {
        _.each(this.areas, (a: Areas, name: string) => {
            callback(a, name);
        })
    }
}

export default Map;
