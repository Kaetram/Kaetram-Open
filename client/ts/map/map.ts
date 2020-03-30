/* global log, _ */

import $ from 'jquery';
import Game from '../game';
import { isInt } from '../utils/util';

export default class Map {
    game: Game;
    renderer: any;
    supportsWorker: any;
    data: any[];
    objects: any[];
    tilesets: any[];
    rawTilesets: any[];
    lastSyncData: any[];
    grid: any;
    webGLMap: any;
    tilesetsLoaded: boolean;
    mapLoaded: boolean;
    preloadedData: boolean;
    readyCallback: any;
    collisions: any;
    tileSize: number;
    width: any;
    height: any;
    blocking: any;
    high: any;
    lights: any;
    animatedTiles: any;
    depth: any;
    constructor(game) {
        this.game = game;
        this.renderer = this.game.renderer;
        this.supportsWorker = this.game.app.hasWorker();

        this.data = [];
        this.objects = [];
        this.tilesets = [];
        this.rawTilesets = [];
        this.lastSyncData = []; // Prevent unnecessary sync data.

        this.grid = null;
        this.webGLMap = null; // Map used for rendering webGL.

        this.tilesetsLoaded = false;
        this.mapLoaded = false;

        this.preloadedData = false;

        this.load();

        this.ready();
    }

    ready() {
        const rC = () => {
            if (this.readyCallback) this.readyCallback();
        };

        if (this.mapLoaded && this.tilesetsLoaded) rC();
        else
            setTimeout(() => {
                this.loadTilesets();
                this.ready();
            }, 50);
    }

    load() {
        if (this.supportsWorker) {
            if (this.game.isDebug())
                console.info('Parsing map with Web Workers...');

            const worker = new Worker('./js/map/mapworker.js');
            worker.postMessage(1);

            worker.onmessage = (event) => {
                const map = event.data;

                this.parseMap(map);
                this.grid = map.grid;
                this.mapLoaded = true;
            };
        } else {
            if (this.game.isDebug()) console.info('Parsing map with Ajax...');

            $.get(
                'data/maps/map.json',
                function(data) {
                    this.parseMap(data);
                    this.loadCollisions();
                    this.mapLoaded = true;
                },
                'json'
            );
        }
    }

    synchronize(tileData) {
        // Use traditional for-loop instead of _

        for (let i = 0; i < tileData.length; i++) {
            const tile = tileData[i];
            const collisionIndex = this.collisions.indexOf(tile.index);
            const objectIndex = this.objects.indexOf(tile.index);

            this.data[tile.index] = tile.data;

            if (tile.isCollision && collisionIndex < 0)
                // Adding new collision tileIndex
                this.collisions.push(tile.index);

            if (!tile.isCollision && collisionIndex > 0) {
                // Removing existing collision tileIndex
                const position = this.indexToGridPosition(tile.index + 1);

                this.collisions.splice(collisionIndex, 1);

                this.grid[position.y][position.x] = 0;
            }

            if (tile.isObject && objectIndex < 0) this.objects.push(tile.index);

            if (!tile.isObject && objectIndex > 0)
                this.objects.splice(objectIndex, 1);
        }

        this.saveRegionData();

        this.lastSyncData = tileData;
    }

    loadTilesets() {
        if (this.rawTilesets.length < 1) return;

        _.each(this.rawTilesets, function(rawTileset) {
            this.loadTileset(rawTileset, function(tileset) {
                this.tilesets[tileset.index] = tileset;

                if (this.tilesets.length === this.rawTilesets.length)
                    this.tilesetsLoaded = true;
            });
        });
    }

    loadTileset(rawTileset, callback) {
        const tileset: any = new Image();

        tileset.index = this.rawTilesets.indexOf(rawTileset);
        tileset.name = rawTileset.imageName;

        tileset.crossOrigin = 'Anonymous';
        tileset.path = 'img/tilesets/' + tileset.name;
        tileset.src = 'img/tilesets/' + tileset.name;
        tileset.raw = tileset;
        tileset.firstGID = rawTileset.firstGID;
        tileset.lastGID = rawTileset.lastGID;
        tileset.loaded = true;
        tileset.scale = rawTileset.scale;

        tileset.onload = () => {
            if (tileset.width % this.tileSize > 0)
                // Prevent uneven tilemaps from loading.
                throw Error(
                    'The tile size is malformed in the tile set: ' +
                        tileset.path
                );

            callback(tileset);
        };

        tileset.onerror = () => {
            throw Error('Could not find tile set: ' + tileset.path);
        };
    }

    parseMap(map) {
        this.width = map.width;
        this.height = map.height;
        this.tileSize = map.tilesize;
        this.blocking = map.blocking || [];
        this.collisions = map.collisions;
        this.high = map.high;
        this.lights = map.lights;
        this.rawTilesets = map.tilesets;
        this.animatedTiles = map.animations;
        this.depth = map.depth;

        for (let i = 0; i < this.width * this.height; i++) this.data.push(0);
    }

    /**
     * To reduce development strain, we convert the entirety of the client
     * map into the bare minimum necessary for the gl-tiled library.
     * This is because gl-tiled uses the original Tiled mapping format.
     * It is easier for us to adapt to that format than to rewrite
     * the entire library adapted for Kaetram.
     */

    formatWebGL() {
        // Create the object's constants.
        const object = {
            compressionlevel: -1,
            width: this.width,
            height: this.height,
            tilewidth: this.tileSize,
            tileheight: this.tileSize,
            type: 'map',
            version: 1.2,
            tiledversion: '1.3.1',
            orientation: 'orthogonal',
            renderorder: 'right-down',
            layers: [],
            tilesets: []
        };

        /* Create 'layers' based on map depth and data. */
        for (let i = 0; i < this.depth; i++) {
            const layerObject = {
                id: i,
                width: object.width,
                height: object.height,
                name: 'layer' + i,
                opacity: 1,
                type: 'tilelayer',
                visible: true,
                x: 0,
                y: 0,
                data: []
            };

            for (let j = 0; j < this.data.length; j++) {
                const tile = this.data[j];

                if (Array.isArray(tile)) {
                    if (tile[i]) layerObject.data[j] = tile[i];
                    else layerObject.data[j] = 0;
                } else if (i === 0) layerObject.data[j] = tile;
                else layerObject.data[j] = 0;
            }

            object.layers.push(layerObject);
        }

        for (let i = 0; i < this.tilesets.length; i++) {
            const tileset = {
                columns: 64,
                margin: 0,
                spacing: 0,
                firstgid: this.tilesets[i].firstGID,
                image: this.tilesets[i].name,
                imagewidth: this.tilesets[i].width,
                imageheight: this.tilesets[i].height,
                name: this.tilesets[i].name.split('.png')[0],
                tilecount:
                    (this.tilesets[i].width / 16) *
                    (this.tilesets[i].height / 16),
                tilewidth: object.tilewidth,
                tileheight: object.tileheight,
                tiles: []
            };

            for (const j in this.animatedTiles) {
                const indx = parseInt(j);

                if (indx > tileset.firstgid - 1 && indx < tileset.tilecount)
                    tileset.tiles.push({
                        animation: this.animatedTiles[j],
                        id: indx
                    });
            }

            console.info(tileset);

            object.tilesets.push(tileset);
        }

        if (this.game.isDebug())
            console.info('Successfully generated the WebGL map.');

        return object;
    }

    loadCollisions() {
        this.grid = [];

        for (let i = 0; i < this.height; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.width; j++) this.grid[i][j] = 0;
        }

        _.each(this.collisions, (index: any) => {
            const position = this.indexToGridPosition(index + 1);
            this.grid[position.y][position.x] = 1;
        });

        _.each(this.blocking, (index: any) => {
            const position = this.indexToGridPosition(index + 1);

            if (this.grid[position.y]) this.grid[position.y][position.x] = 1;
        });
    }

    updateCollisions() {
        _.each(this.collisions, (index: any) => {
            const position = this.indexToGridPosition(index + 1);

            if (position.x > this.width - 1) position.x = this.width - 1;

            if (position.y > this.height - 1) position.y = this.height - 1;

            this.grid[position.y][position.x] = 1;
        });
    }

    indexToGridPosition(index) {
        index -= 1;

        const x = this.getX(index + 1, this.width);
        const y = Math.floor(index / this.width);

        return {
            x: x,
            y: y
        };
    }

    gridPositionToIndex(x, y) {
        return y * this.width + x + 1;
    }

    isColliding(x, y) {
        if (this.isOutOfBounds(x, y) || !this.grid) return false;

        return this.grid[y][x] === 1;
    }

    isObject(x, y) {
        const index = this.gridPositionToIndex(x, y) - 1;

        return this.objects.indexOf(index) > -1;
    }

    isHighTile(id) {
        return this.high.indexOf(id + 1) > -1;
    }

    isLightTile(id) {
        return this.lights.indexOf(id + 1) > -1;
    }

    isAnimatedTile(id) {
        return id in this.animatedTiles;
    }

    isOutOfBounds(x, y) {
        return (
            isInt(x) &&
            isInt(y) &&
            (x < 0 || x >= this.width || y < 0 || y >= this.height)
        );
    }

    getX(index, width) {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    getTileAnimation(id) {
        return this.animatedTiles[id];
    }

    getTilesetFromId(id) {
        for (const idx in this.tilesets)
            if (
                id > this.tilesets[idx].firstGID - 1 &&
                id < this.tilesets[idx].lastGID + 1
            )
                return this.tilesets[idx];

        return null;
    }

    saveRegionData() {
        this.game.storage.setRegionData(this.data, this.collisions);
    }

    loadRegionData() {
        const regionData = this.game.storage.getRegionData();
        const collisions = this.game.storage.getCollisions();

        if (regionData.length < 1) return;

        this.preloadedData = true;

        this.data = regionData;
        this.collisions = collisions;

        this.updateCollisions();
    }

    onReady(callback) {
        this.readyCallback = callback;
    }
};
