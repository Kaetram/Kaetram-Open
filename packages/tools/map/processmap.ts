import _ from 'lodash';
import zlib from 'zlib';

import log from '../../server/src/util/log';
import {
    Chest,
    ChestArea,
    Entity,
    Layer,
    Light,
    MapData,
    MusicArea,
    ObjectGroup,
    OverlayArea,
    ProcessedMap,
    Property,
    Tile,
    Tileset,
    Warp
} from './mapdata';

export default class ProcessMap {
    #map!: ProcessedMap;

    #collisionTiles: { [tileId: number]: boolean } = {};

    public constructor(private data: MapData) {}

    public parse(): void {
        this.#map = {
            width: this.data.width,
            height: this.data.height,
            tileSize: this.data.tilewidth,
            version: Date.now(),

            data: [],

            collisions: [],
            polygons: {},
            entities: {},
            staticEntities: {},

            tilesets: [],
            animations: [],
            depth: 1,

            plateau: {},

            lights: [],
            high: [],
            objects: [],
            trees: {},
            treeIndexes: [],
            rocks: {},
            rockIndexes: [],
            pvpAreas: [],
            gameAreas: [],
            doors: {},
            musicAreas: [],
            chestAreas: [],
            chests: [],
            overlayAreas: [],
            cameraAreas: [],
            achievementAreas: [],
            warps: {},
            cursors: {},
            layers: []
        };

        this.parseTilesets();
        this.parseLayers();
        this.parseDepth();
    }

    private parseTilesets(): void {
        if (Array.isArray(this.data.tilesets))
            _.each(this.data.tilesets, (tileset) => {
                const name = tileset.name.toLowerCase();

                switch (name) {
                    case 'mobs':
                        this.parseEntities(tileset);

                        break;

                    default:
                        this.parseTileset(tileset);

                        break;
                }
            });
        else log.error('Invalid tileset format detected.');
    }

    private parseLayers(): void {
        _.each(this.data.layers, (layer) => {
            switch (layer.type) {
                case 'tilelayer':
                    this.parseTileLayer(layer);
                    break;

                case 'objectgroup':
                    this.parseObjectLayer(layer);
                    break;
            }
        });
    }

    private parseEntities(tileset: Tileset): void {
        _.each(tileset.tiles, (tile) => {
            const tileId = this.getTileId(tileset, tile);

            this.#map.entities[tileId] = {} as Entity;

            _.each(tile.properties, (property) => {
                this.#map.entities[tileId][property.name] = property.value;
            });
        });
    }

    private parseTileset(tileset: Tileset): void {
        this.#map.tilesets.push({
            name: tileset.name,
            firstGID: tileset.firstgid,
            lastGID: tileset.firstgid + tileset.tilecount - 1,
            imageName: tileset.image.includes('/') ? tileset.image.split('/')[2] : tileset.image,
            scale: tileset.name === 'tilesheet' ? 2 : 1
        });

        _.each(tileset.tiles, (tile) => {
            const tileId = this.getTileId(tileset, tile);

            _.each(tile.properties, (property) => {
                this.parseProperties(tileId, property, tile.objectgroup);
            });
        });
    }

    private parseProperties(tileId: number, property: Property, objectGroup?: ObjectGroup): void {
        const name = property.name,
            value = (parseInt(property.value, 10) as never) || property.value;

        if (objectGroup && objectGroup.objects)
            _.each(objectGroup.objects, (object) => {
                if (!(tileId in this.#map.polygons))
                    this.#map.polygons[tileId] = this.parsePolygon(
                        object.polygon,
                        object.x,
                        object.y
                    );
            });

        if (this.isColliding(name) && !(tileId in this.#map.polygons))
            this.#collisionTiles[tileId] = true;

        switch (name) {
            case 'v':
                this.#map.high.push(tileId);
                break;

            case 'o':
                this.#map.objects.push(tileId);
                break;

            case 'tree':
                this.#map.trees[tileId] = value;
                break;

            case 'rock':
                this.#map.rocks[tileId] = value;
                break;

            case 'cursor':
                this.#map.cursors[tileId] = value;
                break;
        }
    }

    private parseTileLayer(layer: Layer): void {
        const name = layer.name.toLowerCase();

        layer.data = this.getLayerData(layer.data, layer.compression) as number[];

        if (name === 'blocking') {
            this.parseBlocking(layer);
            return;
        }

        if (name === 'entities') {
            this.parseStaticEntities(layer);
            return;
        }

        if (name.startsWith('plateau')) {
            this.parsePlateau(layer);
            return;
        }

        this.parseTileLayerData(layer.data);

        this.formatData();
    }

    private parseTileLayerData(data: number[]): void {
        _.each(data, (value, index) => {
            if (value < 1) return;

            if (!this.#map.data[index]) this.#map.data[index] = value;
            else if (_.isArray(this.#map.data[index]))
                (this.#map.data[index] as number[]).push(value);
            else this.#map.data[index] = [this.#map.data[index] as number, value];

            if (value in this.#collisionTiles) this.#map.collisions.push(index);
            if (value in this.#map.trees) this.#map.treeIndexes.push(index);
            if (value in this.#map.rocks) this.#map.rockIndexes.push(index);
        });
    }

    private parseBlocking(layer: Layer): void {
        _.each(layer.data, (value, index) => {
            if (value < 1) return;

            this.#map.collisions.push(index);
        });
    }

    private parseStaticEntities(layer: Layer): void {
        _.each(layer.data, (value, index) => {
            if (value < 1) return;

            if (value in this.#map.entities)
                this.#map.staticEntities[index] = this.#map.entities[value];
        });
    }

    private parsePlateau(layer: Layer): void {
        const level = parseInt(layer.name.split('plateau')[1]);

        _.each(layer.data, (value, index) => {
            if (value < 1) return;

            // We skip collisions
            if (this.#map.collisions.includes(value)) return;

            this.#map.plateau[index] = level;
        });
    }

    private parseObjectLayer(layer: Layer): void {
        const name = layer.name.toLowerCase();

        switch (name) {
            case 'doors': {
                const doors = layer.objects;

                _.each(doors, (door) => {
                    if (door.properties.length > 2)
                        this.#map.doors[door.id] = {
                            o: door.properties[0].value as string,
                            tx: parseInt(door.properties[1].value as string),
                            ty: parseInt(door.properties[2].value as string),
                            x: door.x / 16,
                            y: door.y / 16
                        };
                });

                break;
            }

            case 'warps': {
                const warps = layer.objects;

                _.each(warps, (warp) => {
                    this.#map.warps[warp.name] = {
                        x: warp.x / 16,
                        y: warp.y / 16
                    } as Warp;

                    _.each(warp.properties, (property) => {
                        if (property.name === 'level')
                            property.value = parseInt(property.value as string);

                        this.#map.warps[warp.name][
                            property.name as keyof Warp
                        ] = property.value as number;
                    });
                });

                break;
            }

            case 'chestareas': {
                const cAreas = layer.objects;

                _.each(cAreas, (area) => {
                    const chestArea = {
                        x: area.x / this.#map.tileSize,
                        y: area.y / this.#map.tileSize,
                        width: area.width / this.#map.tileSize,
                        height: area.height / this.#map.tileSize
                    } as ChestArea;

                    _.each(area.properties, (property) => {
                        chestArea[
                            `t${property.name}` as keyof ChestArea
                        ] = property.value as number;
                    });

                    this.#map.chestAreas.push(chestArea);
                });

                break;
            }

            case 'chests': {
                const chests = layer.objects;

                _.each(chests, (chest) => {
                    const oChest = {
                        x: chest.x / this.#map.tileSize,
                        y: chest.y / this.#map.tileSize
                    } as Chest;

                    _.each(chest.properties, (property) => {
                        if (property.name === 'items')
                            oChest.i = (property.value as string).split(',');
                        else oChest[property.name as keyof Chest] = property.value as never;
                    });

                    this.#map.chests.push(oChest);
                });

                break;
            }

            case 'lights': {
                const lights = layer.objects;

                _.each(lights, (lightObject) => {
                    const light = {
                        x: lightObject.x / 16 + 0.5,
                        y: lightObject.y / 16 + 0.5
                    } as Light;

                    _.each(lightObject.properties, (property) => {
                        light[property.name as keyof Light] = property.value as never;
                    });

                    this.#map.lights.push(light);
                });

                break;
            }

            case 'music': {
                const mAreas = layer.objects;

                _.each(mAreas, (area) => {
                    const musicArea = {
                        x: area.x / this.#map.tileSize,
                        y: area.y / this.#map.tileSize,
                        width: area.width / this.#map.tileSize,
                        height: area.height / this.#map.tileSize
                    } as MusicArea;

                    _.each(area.properties, (property) => {
                        musicArea[property.name as keyof MusicArea] = property.value as number;
                    });

                    this.#map.musicAreas.push(musicArea);
                });

                break;
            }

            case 'pvp': {
                const pAreas = layer.objects;

                _.each(pAreas, (area) => {
                    const pvpArea = {
                        x: area.x / this.#map.tileSize,
                        y: area.y / this.#map.tileSize,
                        width: area.width / this.#map.tileSize,
                        height: area.height / this.#map.tileSize
                    };

                    this.#map.pvpAreas.push(pvpArea);
                });

                break;
            }

            case 'overlays': {
                const overlayAreas = layer.objects;

                _.each(overlayAreas, (area) => {
                    const oArea = {
                        id: area.id,
                        x: area.x / this.#map.tileSize,
                        y: area.y / this.#map.tileSize,
                        width: area.width / this.#map.tileSize,
                        height: area.height / this.#map.tileSize
                    } as OverlayArea;

                    _.each(area.properties, (property) => {
                        oArea[property.name as keyof OverlayArea] = (isNaN(property.value as number)
                            ? property.value
                            : parseFloat(property.value as string)) as never;
                    });

                    this.#map.overlayAreas.push(oArea);
                });

                break;
            }

            case 'camera': {
                const cameraAreas = layer.objects;

                _.each(cameraAreas, (area) => {
                    const cArea = {
                        id: area.id,
                        x: area.x / this.#map.tileSize,
                        y: area.y / this.#map.tileSize,
                        width: area.width / this.#map.tileSize,
                        height: area.height / this.#map.tileSize,
                        type: area.properties[0].value as string
                    };

                    this.#map.cameraAreas.push(cArea);
                });

                break;
            }

            case 'achievements': {
                const achievementAreas = layer.objects;

                _.each(achievementAreas, (area) => {
                    const achievementArea = {
                        id: area.id,
                        x: area.x / this.#map.tileSize,
                        y: area.y / this.#map.tileSize,
                        width: area.width / this.#map.tileSize,
                        height: area.height / this.#map.tileSize,
                        achievement: area.properties[0].value as string
                    };

                    this.#map.achievementAreas.push(achievementArea);
                });

                break;
            }

            case 'games': {
                const gAreas = layer.objects;

                _.each(gAreas, (area) => {
                    const gameArea = {
                        x: area.x / this.#map.tileSize,
                        y: area.y / this.#map.tileSize,
                        width: area.width / this.#map.tileSize,
                        height: area.height / this.#map.tileSize
                    };

                    this.#map.gameAreas.push(gameArea);
                });

                break;
            }
        }
    }

    /**
     * Map depth represents the tileIndex with most
     * amount of layers
     */
    private parseDepth(): void {
        let depth = 1;

        _.each(this.#map.data, (info) => {
            if (!_.isArray(info)) return;

            if (info.length > depth) depth = info.length;
        });

        this.#map.depth = depth;
    }

    /**
     * The way Tiled processes polygons is by using the first point
     * as the pivot point around where the rest of the shape is drawn.
     * This can create issues if we start at different point on the shape,
     * so the solution is to append the offset to each point.
     */
    private parsePolygon(polygon: Pos[], offsetX: number, offsetY: number): Pos[] {
        const formattedPolygons: Pos[] = [];

        _.each(polygon, (p) => {
            formattedPolygons.push({
                x: p.x + offsetX,
                y: p.y + offsetY
            });
        });

        return formattedPolygons;
    }

    /**
     * We are generating a map data array without defining preliminary
     * variables. In other words, we are accessing indexes of the array
     * ahead of time, so JavaScript engine just fills in values in the array
     * for us. In this case, it fills in with `null`.
     *
     * An example is accessing index 4 of an empty array and setting value
     * 5 at that index. Because of this, index 0, 1, 2, 3 are going to be
     * set to null. We need to get rid of these values before sending data
     * to the server.
     */
    private formatData(): void {
        _.each(this.#map.data, (value, index) => {
            if (!value) this.#map.data[index] = 0;

            //if (_.isArray(value))
            //    this.map.data[index] = value.reverse();
        });
    }

    /**
     * This function allows us to decompress data from the Tiled editor
     * map file. Thus far, our parser only supports zlib, gzip, and CSV
     * in the JSON file-format. Further support is not entirely necessary
     * but should be considered.
     *
     * @param data The we will be parsing, base64 string format
     * for compressed data, and string for uncompressed data.
     * @param type The type of compression 'zlib', 'gzip', '' are accepted inputs.
     */
    private getLayerData(data: number[], type: string): number[] | void {
        if (_.isArray(data)) return data;

        const dataBuffer = Buffer.from(data, 'base64');
        let inflatedData: Buffer;

        switch (type) {
            case 'zlib':
                inflatedData = zlib.inflateSync(dataBuffer);
                break;

            case 'gzip':
                inflatedData = zlib.gunzipSync(dataBuffer);
                break;

            default:
                log.error('Invalid compression format detected.');
                return;
        }

        if (!inflatedData) return;

        const size = this.#map.width * this.#map.height * 4,
            layerData: number[] = [];

        if (inflatedData.length !== size) {
            log.error('Invalid buffer detected while parsing layer.');
            return;
        }

        for (let i = 0; i < size; i += 4) layerData.push(inflatedData.readUInt32LE(i));

        return layerData;
    }

    /**
     * We are using a unified function in case we need to make adjustments
     * to how we process tiling indexes. An example is not having to go through
     * all the instances of tileId calculations to modify one variable. This
     * is just an overall more organized way of doing work.
     *
     * @param tileset A tileset layer that we are parsing.
     * @param tile The current tile that we are parsing through.
     * @param offset The offset of the tileIndex.
     */
    private getTileId(tileset: Tileset, tile: Tile, offset = 0): number {
        return tileset.firstgid + tile.id + offset;
    }

    public getMap(): string {
        return JSON.stringify(this.#map);
    }

    /**
     * Client map consists of a stripped down version of the game map.
     * We are only sending essential information to the client.
     */
    public getClientMap(): string {
        return JSON.stringify({
            width: this.#map.width,
            height: this.#map.height,
            depth: this.#map.depth,
            collisions: [],
            lights: [],
            version: this.#map.version,
            high: this.#map.high,
            tilesets: this.#map.tilesets,
            animations: this.#map.animations,
            tileSize: this.#map.tileSize
        });
    }

    private isColliding(property: string): boolean {
        return property === 'c' || property === 'o';
    }
}
