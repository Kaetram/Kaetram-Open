/* global module */

import _ from 'underscore';
import Grids from './grids';
import Regions from './regions';
import Utils from '../util/utils';
import Modules from '../util/modules';
import Objects from '../util/objects';
import PVPAreas from './areas/pvpareas';
import MusicAreas from './areas/musicareas';
import ChestAreas from './areas/chestareas';
import OverlayAreas from './areas/overlayareas';
import CameraAreas from './areas/cameraareas';
import World from '../game/entity/character/player/player';
import * as map from '../../data/map/world_server.json';
import * as Spawns from '../../data/spawns.json';
import * as ClientMap from '../../data/map/world_client.json';

class Map {

    world: World;
    ready: boolean;

    regions: Regions;
    grids: Grids;

    version: number;
    clientMap: any;
    width: number;
    height: number;

    collisions: any;
    chestAreas: any;
    chests: any;
    tilesets: any;
    lights: any;
    plateau: any;
    objects: any;
    cursors: any;
    doors: any;

    trees: any;
    treeIndexes: any;

    rocks: any;
    rockIndexes: any;

    zoneWidth: number;
    zoneHeight: number;

    regionWidth: number;
    regionHeight: number;

    areas: any;

    staticEntities: any;

    readyInterval: any;
    readyCallback: Function;

    constructor(world) {
        this.world = world;

        this.ready = false;

        this.load();

        this.regions = new Regions(this);
        this.grids = new Grids(this);
    }

    load() {
        this.version = map.version || 0;

        this.clientMap = ClientMap;

        this.width = map.width;
        this.height = map.height;
        this.collisions = map.collisions;
        this.chestAreas = map.chestAreas;
        this.chests = map.chests;

        this.loadStaticEntities();

        this.tilesets = map.tilesets;
        this.lights = map.lights;
        this.plateau = map.plateau;
        this.objects = map.objects;
        this.cursors = map.cursors;

        // Lumberjacking
        this.trees = map.trees;
        this.treeIndexes = map.treeIndexes;

        // Mining
        this.rocks = map.rocks;
        this.rockIndexes = map.rockIndexes;

        this.zoneWidth = 25;
        this.zoneHeight = 20;

        /**
         * These are temporarily hardcoded,
         * but we will use a dynamic approach.
         */
        this.regionWidth = 40;
        this.regionHeight = 20;

        this.areas = {};

        this.loadAreas();
        this.loadDoors();

        this.ready = true;

        this.readyInterval = setInterval(() => {
            if (!this.world.ready)
                if (this.readyCallback)
                    this.readyCallback();
            else {
                clearInterval(this.readyInterval);
                this.readyInterval = null;
            }

        }, 50);
    }

    loadAreas() {
        /**
         * The structure for the new this.areas is as follows:
         *
         * this.areas = {
         *      pvpAreas = {
         *          allPvpAreas
         *      },
         *
         *      musicAreas = {
         *          allMusicAreas
         *      },
         *
         *      ...
         * }
         */

        this.areas['PVP'] = new PVPAreas();
        this.areas['Music'] = new MusicAreas();
        this.areas['Chests'] = new ChestAreas(this.world);
        this.areas['Overlays'] = new OverlayAreas();
        this.areas['Cameras'] = new CameraAreas();
    }

    loadDoors() {
        this.doors = {};

        _.each(map.doors, (door: any) => {
            let orientation;

            switch (door.o) {
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

            let index = this.gridPositionToIndex(door.x, door.y) + 1;

            this.doors[index] = {
                x: door.tx,
                y: door.ty,
                orientation: orientation,
                portal: door.p ? door.p : 0,
                level: door.l,
                achievement: door.a,
                rank: door.r
            }

        });


    }

    loadStaticEntities() {
        this.staticEntities = [];

        // Legacy static entities (from Tiled);
        _.each(map.staticEntities, (entity, tileIndex) => {
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

    indexToGridPosition(tileIndex) {
        tileIndex -= 1;

        let x = this.getX(tileIndex + 1, this.width),
            y = Math.floor(tileIndex / this.width);

        return {
            x: x,
            y: y
        }
    }

    gridPositionToIndex(x, y) {
        return (y * this.width) + x;
    }

    getX(index, width) {
        if (index === 0)
            return 0;

        return (index % width === 0) ? width - 1 : (index % width) - 1;
    }

    getRandomPosition(area) {
        let pos: any = {},
            valid = false;

        while (!valid) {
            pos.x = area.x + Utils.randomInt(0, area.width + 1);
            pos.y = area.y + Utils.randomInt(0, area.height + 1);
            valid = this.isValidPosition(pos.x, pos.y);
        }

        return pos;
    }

    inArea(posX, posY, x, y, width, height) {
        return posX >= x && posY >= y && posX <= width + x && posY <= height + y;
    }

    inTutorialArea(entity) {
        if (entity.x === -1 || entity.y === -1)
            return true;

        return this.inArea(entity.x, entity.y, 370, 36, 10, 10) ||
                this.inArea(entity.x, entity.y, 312, 11, 25, 22) ||
                this.inArea(entity.x, entity.y, 399, 18, 20, 15);
    }

    nearLight(light, x, y) {
        let diff = Math.round(light.distance / 16),
            startX = light.x - this.zoneWidth - diff,
            startY = light.y - this.zoneHeight - diff,
            endX = light.x + this.zoneWidth + diff,
            endY = light.y + this.zoneHeight + diff;

        return x > startX && y > startY && x < endX && y < endY;
    }

    isObject(id) {
        return this.objects.indexOf(id) > -1;
    }

    getPositionObject(x, y) {
        let index = this.gridPositionToIndex(x, y),
            tiles = this.clientMap.data[index],
            objectId;

        if (tiles instanceof Array)
            for (let i in tiles)
                if (this.isObject(tiles[i]))
                    objectId = tiles[i];
        else
            if (this.isObject(tiles))
                objectId = tiles;

        return objectId;
    }

    getCursor(tileIndex, tileId) {
        if (tileId in this.cursors)
            return this.cursors[tileId];

        let cursor = Objects.getCursor(this.getObjectId(tileIndex));

        if (!cursor)
            return null;

        return cursor;
    }

    getObjectId(tileIndex) {
        let position = this.indexToGridPosition(tileIndex + 1);

        return position.x + '-' + position.y;
    }

    getObject(x, y, data) {
        let index = this.gridPositionToIndex(x, y) - 1,
            tiles = this.clientMap.data[index];

        if (tiles instanceof Array)
            for (let i in tiles)
                if (tiles[i] in data)
                    return tiles[i];

        if (tiles in data)
            return tiles;

        return null;
    }

    getTree(x, y) {
        return this.getObject(x, y, this.trees);
    }

    getRock(x, y) {
        return this.getObject(x, y, this.rocks);
    }

    // Transforms an object's `instance` or `id` into position
    idToPosition(id) {
        let split = id.split('-');

        return { x: parseInt(split[0]), y: parseInt(split[1]) };
    }

    isDoor(x, y) {
        return !!this.doors[this.gridPositionToIndex(x, y) + 1];
    }

    getDoorDestination(x, y) {
        return this.doors[this.gridPositionToIndex(x, y) + 1];
    }

    isValidPosition(x, y) {
        return Number.isInteger(x) && Number.isInteger(y) && !this.isOutOfBounds(x, y) && !this.isColliding(x, y);
    }

    isOutOfBounds(x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    isPlateau(index) {
        return index in this.plateau;
    }

    isColliding(x, y) {
        if (this.isOutOfBounds(x, y))
            return false;

        let tileIndex = this.gridPositionToIndex(x, y);

        return this.collisions.indexOf(tileIndex) > -1;
    }

    /* For preventing NPCs from roaming in null areas. */
    isEmpty(x, y) {
        if (this.isOutOfBounds(x, y))
            return true;

        let tileIndex = this.gridPositionToIndex(x, y);

        return this.clientMap.data[tileIndex] === 0;
    }

    getPlateauLevel(x, y) {
        let index = this.gridPositionToIndex(x, y);

        if (!this.isPlateau(index))
            return 0;

        return this.plateau[index];
    }

    getActualTileIndex(tileIndex) {
        let tileset = this.getTileset(tileIndex);

        if (!tileset)
            return;

        return tileIndex - tileset.firstGID - 1;
    }

    getTileset(tileIndex) {
        /**
         if (id > this.tilesets[idx].firstGID - 1 &&
         id < this.tilesets[idx].lastGID + 1)
            return this.tilesets[idx];
         */

        for (let id in this.tilesets)
            if (this.tilesets.hasOwnProperty(id))
                if (tileIndex > this.tilesets[id].firstGID - 1 &&
                    tileIndex < this.tilesets[id].lastGID + 1)
                    return this.tilesets[id];

        return null;
    }

    isReady(callback) {
        this.readyCallback = callback;
    }

}

export default Map;
