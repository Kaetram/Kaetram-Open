/* global module */

import _ from 'lodash';
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
import AchievementAreas from './areas/achievementareas';
import World from '../game/world';
import Area from './area';
import Entity from '../game/entity/entity';
import map from '../../data/map/world_server.json';
import Spawns from '../../data/spawns.json';
import ClientMap from '../../data/map/world_client.json';

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
    warps: any;

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

    constructor(world: World) {
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
        this.warps = map.warps;

        // Lumberjacking
        this.trees = map.trees;
        this.treeIndexes = map.treeIndexes;

        // Mining
        this.rocks = map.rocks;
        this.rockIndexes = map.rockIndexes;

        this.zoneWidth = 25;
        this.zoneHeight = 25;

        /**
         * These are temporarily hardcoded,
         * but we will use a dynamic approach.
         */
        this.regionWidth = this.width / this.zoneWidth;
        this.regionHeight = this.height / this.zoneHeight;

        this.areas = {};

        this.loadAreas();
        this.loadDoors();

        this.ready = true;

        this.readyInterval = setInterval(() => {
            if (!this.world.ready)
                if (this.readyCallback) this.readyCallback();
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
        this.areas['Achievements'] = new AchievementAreas();
    }

    loadDoors() {
        this.doors = {};

        _.each(map.doors, (door: any) => {
            let orientation: number;

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

    gridPositionToIndex(x: number, y: number) {
        return y * this.width + x;
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
            startX = light.x - this.zoneWidth - diff,
            startY = light.y - this.zoneHeight - diff,
            endX = light.x + this.zoneWidth + diff,
            endY = light.y + this.zoneHeight + diff;

        return x > startX && y > startY && x < endX && y < endY;
    }

    isObject(object: any) {
        return this.objects.indexOf(object) > -1;
    }

    getPositionObject(x: number, y: number) {
        let index = this.gridPositionToIndex(x, y),
            tiles: any = this.clientMap.data[index],
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
        let index = this.gridPositionToIndex(x, y) - 1,
            tiles = this.clientMap.data[index];

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
        return !!this.doors[this.gridPositionToIndex(x, y) + 1];
    }

    getDoorDestination(x: number, y: number) {
        return this.doors[this.gridPositionToIndex(x, y) + 1];
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

        return this.clientMap.data[tileIndex] === 0;
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
        /**
         if (id > this.tilesets[idx].firstGID - 1 &&
         id < this.tilesets[idx].lastGID + 1)
            return this.tilesets[idx];
         */

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

        let warp = this.warps[warpName.toLowerCase()];

        warp.name = warpName;

        return warp;
    }

    isReady(callback: Function) {
        this.readyCallback = callback;
    }
}

export default Map;
