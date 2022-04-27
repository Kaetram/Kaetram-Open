import _ from 'lodash';
import zlib from 'zlib';

import log from '@kaetram/common/util/log';

import { Modules } from '@kaetram/common/network';
import type { ProcessedAnimation, ProcessedMap, ProcessedTree } from '@kaetram/common/types/map';
import type { Layer, LayerObject, MapData, Property, Tile, Tileset, Animation } from './mapdata';

export default class ProcessMap {
    private map: ProcessedMap;
    private tilesetEntities: { [tileId: number]: string } = {};

    #collisionTiles: { [tileId: number]: boolean } = {};
    #trees: { [key: string]: ProcessedTree } = {};

    /**
     * We create the skeleton file for the ExportedMap.
     * @param data The raw data from the Tiled map JSON file.
     */

    public constructor(private data: MapData) {
        let { width, height, tilewidth: tileSize } = this.data,
            divisionSize = Modules.Constants.MAP_DIVISION_SIZE;

        if (width % divisionSize !== 0 || height % divisionSize !== 0)
            log.warning(
                'The map size specified cannot be evenly divided, server may not be able to load the map.'
            );

        this.map = {
            width,
            height,
            tileSize,
            version: Date.now(),

            data: [],

            collisions: [],
            entities: {},

            tilesets: {},
            animations: {},
            depth: 1,

            plateau: {},

            high: [],
            objects: [],
            areas: {},
            cursors: {},
            trees: []
        };

        this.parseTilesets();
        this.parseLayers();
        this.parseDepth();
    }

    /**
     * We iterate through all the tilesets in the map
     * and parse each one of them individually.
     */

    private parseTilesets(): void {
        let { tilesets } = this.data;

        if (!_.isArray(tilesets)) {
            log.error('Could not parse tilesets, corrupted format.');
            return;
        }

        _.each(tilesets, (tileset: Tileset) => {
            /**
             * All the tilesets follow the format of `tilesheet_NUMBER`.
             * We extrac the number in this process, which allows us to properly
             * organize them. Alongside that, we also store the first tileId
             * of each tileset (firstGID) as the key's value.
             */

            let [, tilesetId] = tileset.image.split('-');

            if (tilesetId) this.map.tilesets![parseInt(tilesetId) - 1] = tileset.firstgid - 1;

            this.parseTileset(tileset);

            // Convert local tree dictionary into an array for the server.
            _.each(this.#trees, (tree) => this.map.trees.push(tree));
        });
    }

    /**
     * Parses through each layer in the Tiled map.
     */

    private parseLayers(): void {
        _.each(this.data.layers, (layer: Layer) => {
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

    /**
     * Map depth represents the tileIndex with most
     * amount of layers
     */

    private parseDepth(): void {
        let depth = 1;

        _.each(this.map.data, (info) => {
            if (!_.isArray(info)) return;

            if (info.length > depth) depth = info.length;
        });

        this.map.depth = depth;
    }

    /**
     * We parse the tileset and extract collisions
     * and other individual tile properties.
     * @param tileset A tileset from the tilemap.
     */

    private parseTileset(tileset: Tileset): void {
        let { tiles, firstgid } = tileset;

        _.each(tiles, (tile: Tile) => {
            let tileId = this.getTileId(tileset, tile);

            if (tile.animation) this.parseAnimation(tileId, firstgid, tile.animation);

            _.each(tile.properties, (property: Property) => {
                if (this.isEntityTileset(tileset)) this.tilesetEntities[tileId] = property.value;
                else this.parseProperties(tileId, property);
            });
        });
    }

    private parseAnimation(tileId: number, firstgid: number, animations: Animation[]): void {
        // Temporary storage for animation data.
        let data: ProcessedAnimation[] = [];

        _.each(animations, (animation: Animation) => {
            data.push({
                duration: animation.duration,
                tileId: this.getId(firstgid, animation.tileid, -1)
            });
        });

        this.map.animations![tileId] = data;
    }

    /**
     * Used for extracting information about the tile. Elements such as whether
     * or not it's colliding, an object, or if it has a special cursor
     * property when we hover over it.
     * @param tileId The tileId of the property.
     * @param property The property information of the tile.
     */

    private parseProperties(tileId: number, property: Property): void {
        let { name } = property,
            value = (parseInt(property.value, 10) as never) || property.value,
            { high, objects, cursors } = this.map;

        if (this.isCollisionProperty(name)) this.#collisionTiles[tileId] = true;

        switch (name) {
            case 'v':
                high.push(tileId);
                break;

            case 'o':
                objects.push(tileId);
                break;

            case 'cursor':
                cursors[tileId] = value;
                break;

            case 'tree':
            case 'stump':
            case 'cutstump':
                return this.parseTreeProperty(name, tileId, value);
        }
    }

    /**
     * We decompress the layer data then handle it depending on its properties.
     * Special layers such as `blocking`, `entities`, and `plateau` are parsed
     * independently. The remaining layers are parsed and we layer them in a singular
     * data array.
     * @param layer The layer object all the data.
     */

    private parseTileLayer(layer: Layer): void {
        let name = layer.name.toLowerCase();

        layer.data = this.getLayerData(layer.data, layer.compression)!;

        if (name === 'blocking') return this.parseBlocking(layer);
        if (name === 'entities') return this.parseEntities(layer);
        if (name.startsWith('plateau')) return this.parsePlateau(layer);

        this.parseTileLayerData(layer.data);

        this.format();
    }

    /**
     * We iterate through each tile layer, and for each tile at the
     * same position on the tilemap, we add (if exists) or set the tileId
     * in our overall data file. The format ends up looking like this:
     * [3, 4, 0, [12, 14], [21, 42, 12]] Where the array represents
     * tiles layered on top of eachother.
     *
     * Subsequently, any tile indexes that are colliding are added to the collision
     * array.
     * @param mapData The raw data for each tile layer.
     */

    private parseTileLayerData(mapData: number[]): void {
        let { data, collisions } = this.map;

        _.each(mapData, (value: number, index: number) => {
            if (value < 1) return;

            if (!data[index]) data[index] = value;
            else if (_.isArray(data[index])) (data[index] as number[]).push(value);
            else data[index] = [data[index] as number, value];

            if (value in this.#collisionTiles) collisions.push(index);
        });
    }

    /**
     * A blocking tile is a special type of collision that is
     * added independently of tileIds. It is instead a collision
     * that is part of the map tile index. In other words, we can
     * add a collision to a tile in the map despite that tile
     * not having a collision property.
     * @param layer The tile layer containing the blocking data.
     */

    private parseBlocking(layer: Layer): void {
        _.each(layer.data, (value: number, index: number) => {
            if (value < 1) return;

            this.map.collisions.push(index);
        });
    }

    /**
     * Static entities are spawned using the entities tileset. Each tile contains
     * a property about what entity to spawn. Whne we detect a tileId corresponding
     * to our tiles from the entities tileset, we associate that tileIndex (position)
     * with an entity that should spawn there.
     * @param layer The `entities` layer containing the entity tiles.
     */

    private parseEntities(layer: Layer): void {
        let { entities } = this.map;

        _.each(layer.data, (value: number, index: number) => {
            if (value < 1) return;

            if (value in this.tilesetEntities) entities[index] = this.tilesetEntities[value];
        });
    }

    /**
     * We parse through the plateau (imaginary z-index parts of the map)
     * and store the tileIndex alongside the `plateau level` in our
     * `plateau` array within the map object.
     * @param layer The tile layer containing the tile data.
     */

    private parsePlateau(layer: Layer): void {
        let level = parseInt(layer.name.split('plateau')[1]),
            { collisions, plateau } = this.map;

        _.each(layer.data, (value: number, index: number) => {
            if (value < 1) return;

            // We skip collisions
            if (collisions.includes(value)) return;

            plateau[index] = level;
        });
    }

    /**
     * We parse through pre-defined object layers and add them
     * to the map data.
     * @param layer An object layer from Tiled map.
     */

    private parseObjectLayer(layer: Layer) {
        let { name, objects } = layer,
            { areas } = this.map;

        if (!objects) return;

        if (!(name in areas)) areas[name] = [];

        _.each(objects, (info) => {
            this.parseObject(name, info);
        });
    }

    /**
     * Takes data from Tiled properties and stores it into the areas of the map.
     * @param areaName The name of the area we are storing objects in.
     * @param object The raw layer object data from Tiled.
     */

    private parseObject(areaName: string, object: LayerObject) {
        let { id, x, y, name, width, height, properties } = object;

        this.map.areas[areaName].push({
            id,
            name,
            x: x / this.map.tileSize,
            y: y / this.map.tileSize,
            width: width / this.map.tileSize,
            height: height / this.map.tileSize,
            polygon: this.extractPolygon(object)
        });

        _.each(properties, (property) => {
            let index = this.map.areas[areaName].length - 1, // grab the last object (one we just added)
                { name, value } = property;

            this.map.areas[areaName][index][name as never] = value;
        });
    }

    /**
     * Takes tree property data and stores it into the map trees property.
     * If a tree already exists within said property, it appends data to it.
     * Tree data is split into `data,` `stump,` and `cutStump.` After we
     * store the tree data, we convert it into an array for the server to parse.
     * @param name The name of the property.
     */

    private parseTreeProperty(name: string, tileId: number, value: never): void {
        if (!(value in this.#trees))
            this.#trees[value] = {
                data: [],
                stump: [],
                cutStump: [],
                type: value
            };

        // Organize tree data into their respective arrays.
        switch (name) {
            case 'tree':
                this.#trees[value].data.push(tileId);
                break;

            case 'stump':
                this.#trees[value].stump.push(tileId);
                break;

            case 'cutstump':
                this.#trees[value].cutStump.push(tileId);
                break;
        }
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

        let polygon: Position[] = [],
            { tileSize } = this.map;

        _.each(info.polygon, (point) => {
            polygon.push({
                x: (info.x + point.x) / tileSize,
                y: (info.y + point.y) / tileSize
            });
        });

        return polygon;
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

    private format(): void {
        _.each(this.map.data, (value, index) => {
            if (!value) this.map.data[index] = 0;
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
     * @returns Return a number array containing the data of the layer.
     */

    private getLayerData(data: number[], type: string): number[] {
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
                return [];
        }

        if (!inflatedData) return [];

        let size = this.map.width * this.map.height * 4,
            layerData: number[] = [];

        if (inflatedData.length !== size) {
            log.error('Invalid buffer detected while parsing layer.');
            return [];
        }

        for (let i = 0; i < size; i += 4) layerData.push(inflatedData.readUInt32LE(i));

        return layerData;
    }

    /**
     * Checks the tileset for whether or not it is responsible for entity info.
     * @param tileset The tileset we are checking
     * @returns Whether or not the tileset is for entities.
     */

    private isEntityTileset(tileset: Tileset): boolean {
        return tileset.name.toLowerCase() === 'entities';
    }

    //private isAnimationTile()

    /**
     * A function to check if a property is colliding. We have
     * a separate function as we will add more properties that
     * are colliding.
     * @param propertyName The property name we are iterating.
     * @returns Whether or not the property is a collision or an object.
     */

    private isCollisionProperty(propertyName: string): boolean {
        return propertyName === 'c' || propertyName === 'o';
    }

    /**
     * A barebones function for adding firstgid, id, and offset together
     * when trying to determine the overall tileId of a tile.
     * @param firstgid The first tileId in the tileset.
     * @param id The tileId of the current tile.
     * @param offset Offset if we want.
     * @returns The tileId globally amongst tilesets.
     */

    private getId(firstgid: number, id: number, offset = 0): number {
        return firstgid + id + offset;
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
        return this.getId(tileset.firstgid, tile.id, offset);
    }

    /**
     * Takes the exported map and converts it into a string.
     * @returns A stringified version of the map.
     */

    public getMap(): string {
        let {
            version,
            width,
            height,
            tileSize,
            data,
            collisions,
            areas,
            plateau,
            high,
            objects,
            cursors,
            entities,
            trees
        } = this.map;

        return JSON.stringify({
            version,
            width,
            height,
            tileSize,
            data,
            collisions,
            areas,
            plateau,
            high,
            objects,
            cursors,
            entities,
            trees
        });
    }

    /**
     * Client map consists of a stripped down version of the game map.
     * We are only sending essential information to the client.
     */

    public getClientMap(): string {
        let { width, height, depth, version, high, tilesets, animations, tileSize } = this.map;

        return JSON.stringify({
            width,
            height,
            depth,
            version,
            high,
            tilesets,
            animations,
            tileSize
        });
    }
}
