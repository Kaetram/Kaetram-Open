import zlib from 'node:zlib';

import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import type {
    ProcessedAnimation,
    ProcessedMap,
    ProcessedResource,
    ProcessedTileset
} from '@kaetram/common/types/map';
import type { Animation, Layer, LayerObject, MapData, Property, Tileset } from './mapdata';

interface Resources {
    [key: string]: ProcessedResource;
}

export default class ProcessMap {
    private map: ProcessedMap;
    private tilesetEntities: { [tileId: number]: string } = {};

    private trees: Resources = {};
    private rocks: Resources = {};
    private fishSpots: Resources = {};
    private foraging: Resources = {};

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

            tilesets: [],
            animations: {},

            plateau: {},

            high: [],
            obstructing: [],
            objects: [],
            areas: {},
            cursors: {},
            trees: [],
            rocks: [],
            fishSpots: [],
            foraging: []
        };

        this.parseTilesets();
        this.parseLayers();

        this.format();
    }

    /**
     * We iterate through all the tilesets in the map
     * and parse each one of them individually.
     */

    private parseTilesets(): void {
        let { tilesets } = this.data;

        if (!Array.isArray(tilesets)) {
            log.error('Could not parse tilesets, corrupted format.');
            return;
        }

        for (let key in tilesets) {
            let tileset = tilesets[key];

            /**
             * An upgrade from the hardcoded method of implementing tilesets.
             * This system uses the ID of the tileset from Tiled to store information
             * about the tileset. We calculate its first tile id and last tile id.
             * We ignore the entities layer as it is not a tileset for rendering.
             */

            if (!tileset.name.toLowerCase().includes('entities'))
                this.map.tilesets!.push({
                    firstGid: tileset.firstgid - 1,
                    lastGid: tileset.firstgid - 1 + tileset.tilecount - 1,
                    path: tileset.image,
                    relativePath: this.getRelativePath(tileset.image)
                });

            this.parseTileset(tileset);
        }

        // As the last step of the tileset processing, we parse the resources and add them to the map.
        this.parseResources(this.trees, (tree: ProcessedResource) => this.map.trees.push(tree));
        this.parseResources(this.rocks, (rock: ProcessedResource) => this.map.rocks.push(rock));
        this.parseResources(this.fishSpots, (fishSpot: ProcessedResource) =>
            this.map.fishSpots.push(fishSpot)
        );
        this.parseResources(this.foraging, (forage: ProcessedResource) =>
            this.map.foraging.push(forage)
        );
    }

    /**
     * Parses through each layer in the Tiled map.
     */

    private parseLayers(): void {
        for (let layer of this.data.layers)
            switch (layer.type) {
                case 'tilelayer': {
                    this.parseTileLayer(layer);
                    break;
                }

                case 'objectgroup': {
                    this.parseObjectLayer(layer);
                    break;
                }
            }

        this.parseObstructingTiles();
    }

    /**
     * Handles parsing an individual tileset and extracting all the necessary
     * information, such as tile properties, animations, entities, etc.
     * @param tileset A tileset from the tilemap.
     */

    private parseTileset(tileset: Tileset): void {
        let { tiles, firstgid } = tileset;

        // Tiled starts counting from 1 for some reason.
        firstgid -= 1;

        for (let tile of tiles) {
            let tileId = this.getId(firstgid, tile.id);

            if (tile.animation) this.parseAnimation(tileId, firstgid, tile.animation);

            if (!tile.properties) continue;

            for (let property of tile.properties)
                if (this.isEntityTileset(tileset)) this.tilesetEntities[tileId] = property.value;
                else this.parseProperties(tileId, property);
        }
    }

    /**
     * Handles the animated tile properties.
     * @param tileId Tile ID of the animation tile.
     * @param firstgid The first tile ID that the animation tile bases off of.
     * @param animations Array containing Tiled animation information.
     */

    private parseAnimation(tileId: number, firstgid: number, animations: Animation[]): void {
        // Temporary storage for animation data.
        let data: ProcessedAnimation[] = [];

        for (let animation of animations)
            data.push({
                duration: animation.duration,
                tileId: this.getId(firstgid, animation.tileid, -1)
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
            { collisions, high, obstructing, objects, cursors } = this.map;

        if (this.isCollisionProperty(name)) collisions.push(tileId);

        switch (name) {
            case 'v': {
                high.push(tileId);
                break;
            }

            case 'o': {
                objects.push(tileId);
                break;
            }

            case 'h':
            case 'obs': {
                obstructing?.push(tileId);
                break;
            }

            case 'cursor': {
                cursors[tileId] = value;
                break;
            }

            // Properties fo resource classification.
            case 'tree': {
                return this.parseResourceProperty(this.trees, 'data', tileId, value);
            }

            case 'stump': {
                return this.parseResourceProperty(this.trees, 'base', tileId, value);
            }

            case 'cutstump':
            case 'stumpcut': {
                return this.parseResourceProperty(this.trees, 'depleted', tileId, value);
            }

            // Mining
            case 'rock': {
                return this.parseResourceProperty(this.rocks, 'data', tileId, value);
            }

            case 'rockbase': {
                return this.parseResourceProperty(this.rocks, 'base', tileId, value);
            }

            case 'rockempty': {
                return this.parseResourceProperty(this.rocks, 'depleted', tileId, value);
            }

            // Fishing
            case 'fish':
            case 'fishspot': {
                // Fish spots share the same base and data tiles.
                this.parseResourceProperty(this.fishSpots, 'base', tileId, value);
                return this.parseResourceProperty(this.fishSpots, 'data', tileId, value);
            }

            case 'fishempty': {
                return this.parseResourceProperty(this.fishSpots, 'depleted', tileId, value);
            }

            // Foraging
            case 'forage': {
                // Foraging spots share the same base and data tiles.
                this.parseResourceProperty(this.foraging, 'base', tileId, value);
                return this.parseResourceProperty(this.foraging, 'data', tileId, value);
            }

            case 'forageempty': {
                return this.parseResourceProperty(this.foraging, 'depleted', tileId, value);
            }
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

        if (name === 'entities') return this.parseEntities(layer);
        if (name.startsWith('plateau')) return this.parsePlateau(layer);

        this.parseTileLayerData(layer.data);
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
        let { data } = this.map;

        for (let i in mapData) {
            let value = mapData[i] - 1;

            if (value < 1) continue;

            let index = parseInt(i);

            if (!data[index]) data[index] = value;
            else if (Array.isArray(data[index])) (data[index] as number[]).push(value);
            else data[index] = [data[index] as number, value];
        }
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

        for (let index in layer.data) {
            let value = layer.data[index] - 1;

            if (value < 1) continue;

            if (value in this.tilesetEntities)
                entities[parseInt(index)] = this.tilesetEntities[value];
        }
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

        for (let index in layer.data) {
            let value = layer.data[index];

            if (value < 1) continue;

            // We skip collision
            if (collisions.includes(value)) continue;

            plateau[parseInt(index)] = level;
        }
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

        for (let object of objects) this.parseObject(name, object);
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
            x: Math.round(x / this.map.tileSize),
            y: Math.round(y / this.map.tileSize),
            width: width / this.map.tileSize,
            height: height / this.map.tileSize,
            polygon: this.extractPolygon(object)
        });

        // Some objects may not have properties.
        if (!properties) return;

        for (let property of properties) {
            let index = this.map.areas[areaName].length - 1, // grab the last object (one we just added)
                { name, value } = property;

            this.map.areas[areaName][index][name as never] = value;
        }
    }

    /**
     * Generic implementation for parsing a resource property. This may be a tree, or a rock
     * or anything else in the future. When we pass properties onto this function, we ensure
     * they use the standard `data,` `base,` and `depleted` properties.
     * @param resourceType The type of resource we are adding data onto (trees, rocks, etc.)
     * @param name The name of the property (data, base, depleted)
     * @param tileId The tileId being processed currently (the tile data).
     * @param value The value represents the resource's identifier.
     */

    private parseResourceProperty(
        resourceType: Resources,
        name: string,
        tileId: number,
        value: never
    ): void {
        // Create a new resource type if it does not exist.
        if (!(value in resourceType))
            resourceType[value] = {
                data: [],
                base: [],
                depleted: [],
                type: value
            };

        // Organize resource data into their respective arrays.
        switch (name) {
            case 'data': {
                resourceType[value].data.push(tileId);
                break;
            }

            case 'base': {
                resourceType[value].base.push(tileId);
                break;
            }

            case 'depleted': {
                resourceType[value].depleted.push(tileId);
                break;
            }
        }
    }

    /**
     * Parses through a specified resource and creates a callback after it has been validated.
     * @param resources The list of processed resources to look through.
     * @param callback Contains resource currently being processed.
     */

    private parseResources(
        resources: Resources,
        callback: (resource: ProcessedResource) => void
    ): void {
        for (let resource of Object.values(resources)) {
            // Determine whether the normal and exhausted resource match lengths, otherwise skip.
            if (resource.base.length !== resource.depleted.length)
                return log.error(`${resource.type} has a base and depleted length mismatch.`);

            callback(resource);
        }
    }

    /**
     * Looks through all the tiles in the map and finds which one contain a hidden
     * tile at their uppermost layer. We remove the layers behind the hidden tile.
     */

    private parseObstructingTiles(): void {
        let { data, obstructing } = this.map,
            clearedTiles = 0;

        // For every tile that has a hidden property, we want to remove the tiles behind it.
        for (let index in data) {
            let tile = data[index];

            // Ignore non-array tiles.
            if (!Array.isArray(tile)) continue;

            let obstructingIndex = -1;

            // Iterate from the top of the tile and find the topmost obstructing tile.
            for (let i = tile.length - 1; i >= 0; i--)
                if (obstructing!.includes(tile[i])) {
                    obstructingIndex = i;
                    break;
                }

            // No obstructing tile found, continuing to next index.
            if (obstructingIndex === -1) continue;

            // Splice the data after the obstructing index.
            data[index] = (tile as number[]).splice(obstructingIndex);

            let formattedData = data[index] as number[];

            // eslint-disable-next-line prefer-destructuring
            if ((formattedData as number[]).length === 1) data[index] = formattedData[0];

            clearedTiles++;
        }

        log.notice(`Found ${clearedTiles} full tiles that overlap.`);
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

        for (let point of info.polygon)
            polygon.push({
                x: (info.x + point.x) / tileSize,
                y: (info.y + point.y) / tileSize
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
        for (let i = 0; i < this.map.data.length; i++) if (!this.map.data[i]) this.map.data[i] = 0;
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
        if (Array.isArray(data)) return data;

        let dataBuffer = Buffer.from(data, 'base64'),
            inflatedData: Buffer;

        switch (type) {
            case 'zlib': {
                inflatedData = zlib.inflateSync(dataBuffer);
                break;
            }

            case 'gzip': {
                inflatedData = zlib.gunzipSync(dataBuffer);
                break;
            }

            default: {
                log.error('Invalid compression format detected.');
                return [];
            }
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
     * Extracts a relative path for the client to use when laoding the tileset
     * image. Some tilesets may be placed in subdirectories, so we want to eliminate
     * the first directory if that's the case (since when we export the map and copy
     * the files to the client it is removed).
     * @param path The complete path to the tileset image.
     */

    private getRelativePath(image: string): string {
        let path = image.split('/');

        return path.length > 1 ? path.slice(1).join('/') : image;
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
            trees,
            rocks,
            fishSpots,
            foraging
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
            trees,
            rocks,
            fishSpots,
            foraging
        });
    }

    /**
     * Client map consists of a stripped down version of the game map.
     * We are only sending essential information to the client.
     */

    public getClientMap(): string {
        let { width, height, tileSize, version, high, tilesets, animations } = this.map;

        return JSON.stringify({
            width,
            height,
            tileSize,
            version,
            high,
            tilesets,
            animations
        });
    }

    /**
     * Returns the tileset data.
     * @returns The dictionary of processed tilesets.
     */

    public getTilesets(): ProcessedTileset[] {
        return this.map.tilesets!;
    }
}
