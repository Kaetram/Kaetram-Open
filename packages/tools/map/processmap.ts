import _ from 'lodash';
import zlib from 'zlib';

import log from '@kaetram/common/util/log';

import type { ProcessedArea, ProcessedMap } from '@kaetram/common/types/map';
import type { Entity, Layer, LayerObject, MapData, Property, Tile, Tileset } from './mapdata';

export default class ProcessMap {
    #map!: ProcessedMap;
    #collisionTiles: { [tileId: number]: boolean } = {};

    public constructor(private data: MapData) {}

    public parse(): void {
        let { width, height, tilewidth: tileSize } = this.data;

        this.#map = {
            width,
            height,
            tileSize,
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

            high: [],
            objects: [],
            trees: {},
            treeIndexes: [],
            rocks: {},
            rockIndexes: [],
            areas: {},
            cursors: {},
            layers: []
        };

        this.parseTilesets();
        this.parseLayers();
        this.parseDepth();
    }

    private parseTilesets(): void {
        let { tilesets } = this.data;

        if (Array.isArray(tilesets))
            _.each(tilesets, (tileset) => {
                let name = tileset.name.toLowerCase();

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
            let tileId = this.getTileId(tileset, tile);

            this.#map.entities[tileId] = {} as Entity;

            _.each(tile.properties, (property) => {
                this.#map.entities[tileId][property.name] = property.value;
            });
        });
    }

    private parseTileset(tileset: Tileset): void {
        let { name, firstgid: firstGID, tilecount, image, tiles } = tileset;

        this.#map.tilesets.push({
            name,
            firstGID,
            lastGID: firstGID + tilecount - 1,
            imageName: image.includes('/') ? image.split('/')[2] : image,
            scale: name === 'tilesheet' ? 2 : 1
        });

        _.each(tiles, (tile) => {
            let tileId = this.getTileId(tileset, tile);

            _.each(tile.properties, (property) => {
                this.parseProperties(tileId, property);
            });
        });
    }

    private parseProperties(tileId: number, property: Property): void {
        let { name } = property,
            value = (parseInt(property.value, 10) as never) || property.value,
            { polygons, high, objects, trees, rocks, cursors } = this.#map;

        if (this.isColliding(name) && !(tileId in polygons)) this.#collisionTiles[tileId] = true;

        switch (name) {
            case 'v':
                high.push(tileId);
                break;

            case 'o':
                objects.push(tileId);
                break;

            case 'tree':
                trees[tileId] = value;
                break;

            case 'rock':
                rocks[tileId] = value;
                break;

            case 'cursor':
                cursors[tileId] = value;
                break;
        }
    }

    private parseTileLayer(layer: Layer): void {
        let name = layer.name.toLowerCase();

        layer.data = this.getLayerData(layer.data, layer.compression)!;

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

    private parseTileLayerData(mapData: number[]): void {
        let { data, collisions, trees, treeIndexes, rocks, rockIndexes } = this.#map;

        _.each(mapData, (value, index) => {
            if (value < 1) return;

            if (!data[index]) data[index] = value;
            else if (_.isArray(data[index])) (data[index] as number[]).push(value);
            else data[index] = [data[index] as number, value];

            if (value in this.#collisionTiles) collisions.push(index);
            if (value in trees) treeIndexes.push(index);
            if (value in rocks) rockIndexes.push(index);
        });
    }

    private parseBlocking(layer: Layer): void {
        _.each(layer.data, (value, index) => {
            if (value < 1) return;

            this.#map.collisions.push(index);
        });
    }

    private parseStaticEntities(layer: Layer): void {
        let { entities, staticEntities } = this.#map;

        _.each(layer.data, (value, index) => {
            if (value < 1) return;

            if (value in entities) staticEntities[index] = entities[value];
        });
    }

    private parsePlateau(layer: Layer): void {
        let level = parseInt(layer.name.split('plateau')[1]),
            { collisions, plateau } = this.#map;

        _.each(layer.data, (value, index) => {
            if (value < 1) return;

            // We skip collisions
            if (collisions.includes(value)) return;

            plateau[index] = level;
        });
    }

    /**
     * We parse through pre-defined object layers and add them
     * to the map data.
     *
     * @param layer An object layer from Tiled map.
     */
    private parseObjectLayer(layer: Layer) {
        let { name, objects } = layer,
            { areas } = this.#map;

        if (!objects) return;

        if (!(name in areas)) areas[name] = [];

        _.each(objects, (info) => {
            this.parseObject(name, info);
        });
    }

    /**
     * @param objectName The object info in the map that we are storing the data in.
     * @param info The raw data received from Tiled.
     */
    private parseObject(objectName: string, info: LayerObject) {
        let { id, name, x, y, width, height, properties } = info,
            { tileSize, areas } = this.#map,
            object: ProcessedArea = {
                id,
                name,
                x: x / tileSize,
                y: y / tileSize,
                width: width / tileSize,
                height: height / tileSize,
                polygon: this.extractPolygon(info)
            };

        _.each(properties, (prop) => {
            let name = prop.name as keyof ProcessedArea,
                { value } = prop;

            if (
                new Set([
                    'id',
                    'x',
                    'y',
                    'distance',
                    'darkness',
                    'diffuse',
                    'level',
                    'achievement'
                ]).has(name)
            ) {
                let number = parseFloat(value);
                if (isNaN(number)) number = -1;

                value = number as never;
            }

            object[name] = value;
        });

        areas[objectName].push(object);
    }

    /**
     * Polygons are drawn without the offset, we add the `x` and `y` position
     * of the object to get the true position of the polygon.
     *
     * @param info The raw data from Tiled
     * @returns A modified array of polygons adjusted for `tileSize`.
     */
    private extractPolygon(info: LayerObject) {
        if (!info.polygon) return;

        let polygon: Pos[] = [],
            { tileSize } = this.#map;
        // console.log(info);

        _.each(info.polygon, (point) => {
            polygon.push({
                x: (info.x + point.x) / tileSize,
                y: (info.y + point.y) / tileSize
            });
        });

        return polygon;
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
        let { data } = this.#map;

        _.each(data, (value, index) => {
            if (!value) data[index] = 0;

            // if (_.isArray(value)) data[index] = value.reverse();
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

        let dataBuffer = Buffer.from(data, 'base64'),
            inflatedData: Buffer;

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

        let size = this.#map.width * this.#map.height * 4,
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
        let { width, height, depth, version, high, tilesets, animations, tileSize } = this.#map;

        return JSON.stringify({
            width,
            height,
            depth,
            version,
            high,
            tilesets,
            animations,
            tileSize,
            collisions: [],
            lights: []
        });
    }

    private isColliding(property: string): boolean {
        return property === 'c' || property === 'o';
    }
}
