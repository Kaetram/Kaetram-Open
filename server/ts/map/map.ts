import * as _ from 'underscore';
import Grids from './grids';
import Regions from './regions';
import Utils from '../util/utils';
import config from '../../config';
import Modules from '../util/modules';
import PVPAreas from './areas/pvpareas';
import MusicAreas from './areas/musicareas';
import ChestAreas from './areas/chestareas';
import map from '../../data/map/world_server.json';
import Spawns from '../../data/spawns.json';
import OverlayAreas from './areas/overlayareas';
import CameraAreas from './areas/cameraareas';
import Mobs from '../util/mobs';
import ClientMap from '../../data/map/world_client.json';
import Entity from '../game/entity/entity';

/**
 *
 */
class Map {
    public width: any;

    public objects: any;

    public doors: any;

    public height: any;

    public plateau: any;

    public readyCallback: any;

    public version: any;

    public collisions: any;

    public chestAreas: any;

    public chests: any;

    public tilesets: any;

    public lights: any;

    public zoneWidth: any;

    public zoneHeight: any;

    public regionWidth: any;

    public regionHeight: any;

    public areas: any;

    public ready: any;

    public readyInterval: any;

    public world: any;

    public staticEntities: any;

    regions: any;

    grids: any;

    constructor(world) {
        this.world = world;

        this.ready = false;

        this.load();

        this.regions = new Regions(this);
        this.grids = new Grids(this);
    }

    load() {
        this.version = map.version || 0;

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

        this.zoneWidth = 25;
        this.zoneHeight = 20;

        this.regionWidth = Math.floor(this.width / this.zoneWidth);
        this.regionHeight = Math.floor(this.height / this.zoneHeight);

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
         * ```
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
         * ```
         */

        this.areas.PVP = new PVPAreas();
        this.areas.Music = new MusicAreas();
        this.areas.Chests = new ChestAreas(this.world);
        this.areas.Overlays = new OverlayAreas();
        this.areas.Cameras = new CameraAreas();
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

            this.doors[this.gridPositionToIndex(door.x, door.y)] = {
                x: door.tx,
                y: door.ty,
                orientation,
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
        _.each(map.staticEntities, (entity: Entity, tileIndex) => {
            this.staticEntities.push({
                tileIndex,
                string: entity.type,
                roaming: entity.roaming
            });
        });

        _.each(Spawns, (data: any) => {
            const tileIndex = this.gridPositionToIndex(data.x - 1, data.y);

            this.staticEntities.push({
                tileIndex,
                string: data.string,
                roaming: data.roaming,
                miniboss: data.miniboss,
                boss: data.boss
            });
        });
    }

    indexToGridPosition(tileIndex) {
        tileIndex -= 1;

        const x = this.getX(tileIndex + 1, this.width);
        const y = Math.floor(tileIndex / this.width);

        return {
            x,
            y
        };
    }

    gridPositionToIndex(x, y) {
        return y * this.width + x + 1;
    }

    getX(index, width) {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    getRandomPosition(area) {
        const pos: { [key: string]: any } = {};
        let valid = false;

        while (!valid) {
            pos.x = area.x + Utils.randomInt(0, area.width + 1);
            pos.y = area.y + Utils.randomInt(0, area.height + 1);
            valid = this.isValidPosition(pos.x, pos.y);
        }

        return pos;
    }

    inArea(posX, posY, x, y, width, height) {
        return (
            posX >= x && posY >= y && posX <= width + x && posY <= height + y
        );
    }

    inTutorialArea(entity) {
        if (entity.x === -1 || entity.y === -1) return true;

        return (
            this.inArea(entity.x, entity.y, 370, 36, 10, 10) ||
            this.inArea(entity.x, entity.y, 312, 11, 25, 22) ||
            this.inArea(entity.x, entity.y, 399, 18, 20, 15)
        );
    }

    nearLight(light, x, y) {
        const diff = Math.round(light.distance / 16);
        const startX = light.x - this.zoneWidth - diff;
        const startY = light.y - this.zoneHeight - diff;
        const endX = light.x + this.zoneWidth + diff;
        const endY = light.y + this.zoneHeight + diff;

        return x > startX && y > startY && x < endX && y < endY;
    }

    isObject(id) {
        return this.objects.indexOf(id) > -1;
    }

    isDoor(x, y) {
        return !!this.doors[this.gridPositionToIndex(x, y)];
    }

    getDoorDestination(x, y) {
        return this.doors[this.gridPositionToIndex(x, y)];
    }

    isValidPosition(x, y) {
        return (
            x.isInteger() &&
            y.isInteger() &&
            !this.isOutOfBounds(x, y) &&
            !this.isColliding(x, y)
        );
    }

    isOutOfBounds(x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    isPlateau(index) {
        return index in this.plateau;
    }

    isColliding(x, y) {
        if (this.isOutOfBounds(x, y)) return false;

        const tileIndex = this.gridPositionToIndex(x - 1, y);

        return this.collisions.indexOf(tileIndex) > -1;
    }

    /* For preventing NPCs from roaming in null areas. */
    isEmpty(x, y) {
        if (this.isOutOfBounds(x, y)) return true;

        const tileIndex = this.gridPositionToIndex(x - 1, y);

        return (ClientMap as any).data[tileIndex] === 0;
    }

    getPlateauLevel(x, y) {
        const index = this.gridPositionToIndex(x - 1, y);

        if (!this.isPlateau(index)) return 0;

        return this.plateau[index];
    }

    getActualTileIndex(tileIndex) {
        const tileset = this.getTileset(tileIndex);

        if (!tileset) return;

        return tileIndex - tileset.firstGID - 1;
    }

    getTileset(tileIndex) {
        // if (
        //     id > this.tilesets[idx].firstGID - 1 &&
        //     id < this.tilesets[idx].lastGID + 1
        // )
        //     return this.tilesets[idx];

        for (const id in this.tilesets)
            if (this.tilesets.hasOwnProperty(id))
                if (
                    tileIndex > this.tilesets[id].firstGID - 1 &&
                    tileIndex < this.tilesets[id].lastGID + 1
                )
                    return this.tilesets[id];

        return null;
    }

    isReady(callback) {
        this.readyCallback = callback;
    }
}

export default Map;
