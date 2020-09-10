import _ from 'lodash';
import { MapData } from './exportmap';

const collisions = {},
    entities = {};

let mobsFirstGid = -1;

export default class ProcessMap {
    depth: number;
    map: MapData;
    mode: string;

    constructor(public json: MapData, public options: { mode: string }) {
        this.json = json;
        this.options = options;
        this.mode = options.mode;

        this.load();
    }

    load(): MapData {
        const { mode } = this.options;

        this.map = {
            width: 0,
            height: 0,
            collisions: [],
            version: new Date().getTime()
        };
        const { map } = this;

        switch (mode) {
            case 'info':
                map.lights = [];
                map.high = [];
                map.animated = {};
                map.tilesets = [];
                map.animations = {};

                break;

            case 'client':
                map.lights = [];
                map.data = [];
                map.high = [];

                map.animated = {};
                map.depth = 1;

                break;

            case 'server':
                map.objects = [];
                map.cursors = {};

                map.trees = {};
                map.treeIndexes = [];

                map.rocks = {};
                map.rockIndexes = [];

                map.tilesets = [];
                map.pvpAreas = [];
                map.gameAreas = [];
                map.doors = {};
                map.musicAreas = [];

                map.staticEntities = {};
                map.chestAreas = [];
                map.chests = [];

                map.overlayAreas = [];
                map.cameraAreas = [];

                map.achievementAreas = [];

                map.lights = [];
                map.plateau = {};

                map.warps = {};

                break;
        }

        map.width = this.json.width;
        map.height = this.json.height;

        map.tilesize = this.json.tilewidth;

        //

        if (this.json.tilesets instanceof Array) {
            _.each(this.json.tilesets, (tileset) => {
                const name = tileset.name.toLowerCase();

                if (mode === 'info' || mode === 'server')
                    if (tileset.name !== 'Mobs')
                        map.tilesets.push({
                            name: tileset.name,
                            firstGID: tileset.firstgid,
                            lastGID: tileset.firstgid + tileset.tilecount - 1,
                            imageName: tileset.image.includes('/')
                                ? tileset.image.split('/')[2]
                                : tileset.image,
                            scale: tileset.name === 'tilesheet' ? 2 : 1
                        });

                if (name === 'mobs' && mode === 'server') {
                    mobsFirstGid = tileset.firstgid;

                    _.each(tileset.tiles, (tile) => {
                        entities[parseInt(tile.id) + 1] = {};

                        _.each(tile.properties, (property) => {
                            entities[parseInt(tile.id) + 1][property.name] = property.value;
                        });
                    });
                }

                _.each(tileset.tiles, (tile) => {
                    const id = parseInt(tileset.firstgid) + parseInt(tile.id);

                    if (tile.animation && mode === 'info')
                        this.handleAnimation(id, tileset.firstgid, tile);
                    else
                        _.each(tile.properties, (data) => {
                            this.handleProperty(
                                data.name,
                                this.isValid(parseInt(data.value, 10))
                                    ? parseInt(data.value, 10)
                                    : data.value,
                                id
                            );
                        });
                });
            });
        }

        _.each(this.json.layers, (layer) => {
            const name = layer.name.toLowerCase();

            if (mode === 'server')
                switch (name) {
                    case 'doors': {
                        const doors = layer.objects;

                        _.each(doors, (door) => {
                            if (door.properties.length > 2) {
                                map.doors[door.id] = {
                                    o: door.properties[0].value,
                                    tx: parseInt(door.properties[1].value),
                                    ty: parseInt(door.properties[2].value),
                                    x: door.x / 16,
                                    y: door.y / 16
                                };
                            }
                        });

                        break;
                    }

                    case 'warps': {
                        const warps = layer.objects;

                        _.each(warps, (warp) => {
                            map.warps[warp.name] = {
                                x: warp.x / 16,
                                y: warp.y / 16
                            };

                            _.each(warp.properties, (property) => {
                                if (property.name === 'level')
                                    property.value = parseInt(property.value);

                                map.warps[warp.name][property.name] = property.value;
                            });
                        });

                        break;
                    }

                    case 'chestareas': {
                        const cAreas = layer.objects;

                        _.each(cAreas, (area) => {
                            const chestArea = {
                                x: area.x / map.tilesize,
                                y: area.y / map.tilesize,
                                width: area.width / map.tilesize,
                                height: area.height / map.tilesize
                            };

                            _.each(area.properties, (property) => {
                                chestArea['t' + property.name] = property.value;
                            });

                            map.chestAreas.push(chestArea);
                        });

                        break;
                    }

                    case 'chests': {
                        const chests = layer.objects;

                        _.each(chests, (chest) => {
                            const oChest: { [key: string]: number } = {
                                x: chest.x / map.tilesize,
                                y: chest.y / map.tilesize
                            };

                            _.each(chest.properties, (property) => {
                                if (property.name === 'items') oChest.i = property.value.split(',');
                                else oChest[property.name] = property.value;
                            });

                            map.chests.push(oChest);
                        });

                        break;
                    }

                    case 'lights': {
                        const lights = layer.objects;

                        _.each(lights, (lightObject) => {
                            const light = {
                                x: lightObject.x / 16 + 0.5,
                                y: lightObject.y / 16 + 0.5
                            };

                            _.each(lightObject.properties, (property) => {
                                light[property.name] = property.value;
                            });

                            map.lights.push(light);
                        });

                        break;
                    }

                    case 'music': {
                        const mAreas = layer.objects;

                        _.each(mAreas, (area) => {
                            const musicArea = {
                                x: area.x / map.tilesize,
                                y: area.y / map.tilesize,
                                width: area.width / map.tilesize,
                                height: area.height / map.tilesize
                            };

                            _.each(area.properties, (property) => {
                                musicArea[property.name] = property.value;
                            });

                            map.musicAreas.push(musicArea);
                        });

                        break;
                    }

                    case 'pvp': {
                        const pAreas = layer.objects;

                        _.each(pAreas, (area) => {
                            const pvpArea = {
                                x: area.x / map.tilesize,
                                y: area.y / map.tilesize,
                                width: area.width / map.tilesize,
                                height: area.height / map.tilesize
                            };

                            map.pvpAreas.push(pvpArea);
                        });

                        break;
                    }

                    case 'overlays': {
                        const overlayAreas = layer.objects;

                        _.each(overlayAreas, (area) => {
                            const oArea = {
                                id: area.id,
                                x: area.x / map.tilesize,
                                y: area.y / map.tilesize,
                                width: area.width / map.tilesize,
                                height: area.height / map.tilesize
                            };

                            _.each(area.properties, (property) => {
                                oArea[property.name] = isNaN(property.value)
                                    ? property.value
                                    : parseFloat(property.value);
                            });

                            map.overlayAreas.push(oArea);
                        });

                        break;
                    }

                    case 'camera': {
                        const cameraAreas = layer.objects;

                        _.each(cameraAreas, (area) => {
                            const cArea = {
                                id: area.id,
                                x: area.x / map.tilesize,
                                y: area.y / map.tilesize,
                                width: area.width / map.tilesize,
                                height: area.height / map.tilesize,
                                type: area.properties[0].value
                            };

                            map.cameraAreas.push(cArea);
                        });

                        break;
                    }

                    case 'achievements': {
                        const achievementAreas = layer.objects;

                        _.each(achievementAreas, (area) => {
                            const achievementArea = {
                                id: area.id,
                                x: area.x / map.tilesize,
                                y: area.y / map.tilesize,
                                width: area.width / map.tilesize,
                                height: area.height / map.tilesize,
                                achievement: area.properties[0].value
                            };

                            map.achievementAreas.push(achievementArea);
                        });

                        break;
                    }

                    case 'games': {
                        const gAreas = layer.objects;

                        _.each(gAreas, (area) => {
                            const gameArea = {
                                x: area.x / map.tilesize,
                                y: area.y / map.tilesize,
                                width: area.width / map.tilesize,
                                height: area.height / map.tilesize
                            };

                            map.gameAreas.push(gameArea);
                        });

                        break;
                    }
                }
        });

        for (let i = this.json.layers.length; i > 0; i--) this.parseLayer(this.json.layers[i - 1]);

        if (mode === 'client') {
            for (let i = 0, max = map.data.length; i < max; i++) if (!map.data[i]) map.data[i] = 0;

            map.depth = this.calculateDepth(map);
        }

        if (mode === 'info') map.collisions = [];

        return map;
    }

    handleProperty(property: string, value: number, id: number): void {
        const { map } = this;
        if (property === 'c' || property === 'o') collisions[id] = true;

        if (this.mode === 'client' || this.mode === 'info') {
            if (property === 'v') map.high.push(id);

            if (property === 'l') map.lights.push(id);

            if (property === 'length') {
                if (!map.animated[id]) map.animated[id] = {};

                map.animated[id].l = value;
            }

            if (property === 'delay') {
                if (!map.animated[id]) map.animated[id] = {};

                map.animated[id].d = value;
            }
        }

        if (this.mode === 'server' && property === 'o') map.objects.push(id);

        if (this.mode === 'server' && property === 'cursor') map.cursors[id] = value;

        if (this.mode === 'server' && property === 'tree') map.trees[id] = value;

        if (this.mode === 'server' && property === 'rock') map.rocks[id] = value;
    }

    handleAnimation(id: number, firstGID: string, tile): void {
        const animationData = [];

        _.each(tile.animation, (animation) => {
            animationData.push({
                duration: animation.duration,
                tileid: parseInt(firstGID) + parseInt(animation.tileid) - 1
            });
        });

        this.map.animations[id - 1] = animationData;
    }

    calculateDepth(map: MapData): number {
        let depth = 1;

        _.each(map.data, (info) => {
            if (!_.isArray(info)) return;

            if (info.length > depth) depth = info.length;
        });

        return depth;
    }

    isValid(number: any): boolean {
        return number && !isNaN(number - 0) && number !== null && number !== '' && number !== false;
    }

    parseLayer(layer): void {
        const name = layer.name.toLowerCase(),
            type = layer.type;

        if (name === 'entities' && this.mode === 'server') {
            const tiles = layer.data;

            for (let i = 0; i < tiles.length; i++) {
                const gid = tiles[i] - mobsFirstGid + 1;

                if (gid && gid > 0) this.map.staticEntities[i] = entities[gid];
            }
        }

        const tiles = layer.data;

        if (name === 'blocking' && this.mode === 'client') {
            for (let j = 0; j < tiles.length; j++) {
                const bGid = tiles[j];

                if (bGid && bGid > 0) this.map.collisions.push(j);
            }
        } else if (name.startsWith('plateau') && this.mode === 'server') {
            for (let j = 0; j < tiles.length; j++) {
                const pGid = tiles[j],
                    level = parseInt(name.split('plateau')[1]);

                if (this.map.collisions.indexOf(j) > -1)
                    // Skip collision indexes.
                    continue;

                if (pGid && pGid > 0) this.map.plateau[j] = level;
            }
        } else if (
            type === 'tilelayer' &&
            layer.visible !== 0 &&
            name !== 'entities' &&
            !name.startsWith('plateau')
        ) {
            for (let k = 0; k < tiles.length; k++) {
                const tGid = tiles[k];

                if (this.mode === 'client') {
                    if (tGid > 0) {
                        if (this.map.data[k] === undefined) this.map.data[k] = tGid;
                        else if (this.map.data[k] instanceof Array) this.map.data[k].unshift(tGid);
                        else this.map.data[k] = [tGid, this.map.data[k]];
                    }
                }

                if (tGid in collisions) this.map.collisions.push(k);

                if (this.mode === 'server' && tGid in this.map.trees) this.map.treeIndexes.push(k);

                if (this.mode === 'server' && tGid in this.map.rocks) this.map.rockIndexes.push(k);
            }
        }
    }
}
