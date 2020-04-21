/* global log, _ */

define(['jquery'], function($) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;
            self.renderer = self.game.renderer;
            self.supportsWorker = self.game.app.hasWorker();

            self.data = [];
            self.objects = [];
            self.tilesets = [];
            self.rawTilesets = [];
            self.lastSyncData = []; // Prevent unnecessary sync data.

            self.grid = null;
            self.webGLMap = null; // Map used for rendering webGL.

            self.tilesetsLoaded = false;
            self.mapLoaded = false;

            self.preloadedData = false;

            self.load();

            self.ready();
        },

        ready: function() {
            var self = this,
                rC = function() {
                    if (self.readyCallback)
                        self.readyCallback();
                };

            if (self.mapLoaded && self.tilesetsLoaded)
                rC();
            else
                setTimeout(function() {
                    self.loadTilesets();
                    self.ready();
                }, 50);

        },

        load: function() {
            var self = this;

            if (self.supportsWorker) {
                if (self.game.isDebug())
                    log.info('Parsing map with Web Workers...');

                var worker = new Worker('./js/map/mapworker.js');
                worker.postMessage(1);

                worker.onmessage = function(event) {
                    var map = event.data;

                    self.parseMap(map);
                    self.grid = map.grid;
                    self.mapLoaded = true;
                }
            } else {
                if (self.game.isDebug())
                    log.info('Parsing map with Ajax...');

                $.get('data/maps/map.json', function(data) {
                    self.parseMap(data);
                    self.loadCollisions();
                    self.mapLoaded = true;
                }, 'json');
            }
        },

        synchronize: function(tileData) {
            var self = this;
            // Use traditional for-loop instead of _
            for (var i = 0; i < tileData.length; i++) {
                var tile = tileData[i],
                    collisionIndex = self.collisions.indexOf(tile.index),
                    objectIndex = self.objects.indexOf(tile.index);

                self.data[tile.index] = tile.data;

                if (tile.isCollision && collisionIndex < 0) // Adding new collision tileIndex
                    self.collisions.push(tile.index);

                if (!tile.isCollision && collisionIndex > 0) { // Removing existing collision tileIndex
                    var position = self.indexToGridPosition(tile.index + 1);

                    self.collisions.splice(collisionIndex, 1);

                    self.grid[position.y][position.x] = 0;
                }

                if (tile.isObject && objectIndex < 0)
                    self.objects.push(tile.index);

                if (!tile.isObject && objectIndex > 0)
                    self.objects.splice(objectIndex, 1);

            }

            if (self.webGLMap)
                self.synchronizeWebGL(tileData);

            self.saveRegionData();

            self.lastSyncData = tileData;
        },

        loadTilesets: function() {
            var self = this;

            if (self.rawTilesets.length < 1)
                return;

            _.each(self.rawTilesets, function(rawTileset) {

                self.loadTileset(rawTileset, function(tileset) {
                    self.tilesets[tileset.index] = tileset;

                    if (self.tilesets.length === self.rawTilesets.length)
                        self.tilesetsLoaded = true;

                });

            });

        },

        loadTileset: function(rawTileset, callback) {
            var self = this,
                tileset = new Image();

            tileset.index = self.rawTilesets.indexOf(rawTileset);
            tileset.name = rawTileset.imageName;

            tileset.crossOrigin = 'Anonymous';
            tileset.path = 'img/tilesets/' + tileset.name;
            tileset.src = 'img/tilesets/' + tileset.name;
            tileset.raw = tileset;
            tileset.firstGID = rawTileset.firstGID;
            tileset.lastGID = rawTileset.lastGID;
            tileset.loaded = true;
            tileset.scale = rawTileset.scale;

            tileset.onload = function() {
                if (tileset.width % self.tileSize > 0) // Prevent uneven tilemaps from loading.
                    throw Error('The tile size is malformed in the tile set: ' + path);

                callback(tileset);
            };

            tileset.onerror = function() {
                throw Error('Could not find tile set: ' + path);
            };
        },

        parseMap: function(map) {
            var self = this;

            self.width = map.width;
            self.height = map.height;
            self.tileSize = map.tilesize;
            self.blocking = map.blocking || [];
            self.collisions = map.collisions;
            self.high = map.high;
            self.lights = map.lights;
            self.rawTilesets = map.tilesets;
            self.animatedTiles = map.animations;
            self.depth = map.depth;

            for (var i = 0; i < self.width * self.height; i++)
                self.data.push(0);
        },

        // Load the webGL map into the memory.
        loadWebGL: function(context) {
            var self = this,
                map = self.formatWebGL(),
                resources = {};

            for (var i = 0; i < self.tilesets.length; i++) {
                resources[self.tilesets[i].name] = {
                    name: self.tilesets[i].name,
                    url: self.tilesets[i].path,
                    data: self.tilesets[i],
                    extension: 'png'
                };
            }

            if (self.webGLMap)
                self.webGLMap.glTerminate();

            self.webGLMap = new glTiled.GLTilemap(map, {
                gl: context,
                assetCache: resources
            });

            self.webGLMap.glInitialize(context);
            self.webGLMap.repeatTiles = false;

            context.viewport(0, 0, context.canvas.width, context.canvas.height);
            self.webGLMap.resizeViewport(context.canvas.width, context.canvas.height);


        },

        /**
         * To reduce development strain, we convert the entirety of the client
         * map into the bare minimum necessary for the gl-tiled library.
         * This is because gl-tiled uses the original Tiled mapping format.
         * It is easier for us to adapt to that format than to rewrite
         * the entire library adapted for Kaetram.
         */

        formatWebGL: function() {
            // Create the object's constants.
            var self = this,
                object = {
                    compressionlevel: -1,
                    width: self.width,
                    height: self.height,
                    tilewidth: self.tileSize,
                    tileheight: self.tileSize,
                    type: 'map',
                    version: 1.2,
                    tiledversion: '1.3.1',
                    orientation: 'orthogonal',
                    renderorder: 'right-down',
                    layers: [],
                    tilesets: []
                };

            /* Create 'layers' based on map depth and data. */
            for (var i = 0; i < self.depth; i++) {
                var layerObject = {
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

                for (var j = 0; j < self.data.length; j++) {
                    var tile = self.data[j];

                    if (Array.isArray(tile)) {
                        if (tile[i])
                            layerObject.data[j] = tile[i];
                        else
                            layerObject.data[j] = 0;
                    } else
                        if (i === 0)
                            layerObject.data[j] = tile;
                        else
                            layerObject.data[j] = 0;

                }

                object.layers.push(layerObject);
            }

            for (var i = 0; i < self.tilesets.length; i++) {
                var tileset = {
                    columns: 64,
                    margin: 0,
                    spacing: 0,
                    firstgid: self.tilesets[i].firstGID,
                    image: self.tilesets[i].name,
                    imagewidth: self.tilesets[i].width,
                    imageheight: self.tilesets[i].height,
                    name: self.tilesets[i].name.split('.png')[0],
                    tilecount: (self.tilesets[i].width / 16) * (self.tilesets[i].height / 16),
                    tilewidth: object.tilewidth,
                    tileheight: object.tileheight,
                    tiles: []
                };

                for (var j in self.animatedTiles) {
                    var indx = parseInt(j);

                    if (indx > tileset.firstgid - 1 && indx < tileset.tilecount)
                        tileset.tiles.push({
                            animation: self.animatedTiles[j],
                            id: indx
                        });
                }

                log.info(tileset);

                object.tilesets.push(tileset);
            }

            if (self.game.isDebug())
                log.info('Successfully generated the WebGL map.');

            return object;
        },

        synchronizeWebGL: function(tileData) {
            var self = this;

            self.loadWebGL(self.renderer.backContext);
        },

        loadCollisions: function() {
            var self = this;

            self.grid = [];

            for (var i = 0; i < self.height; i++) {
                self.grid[i] = [];
                for (var j = 0; j < self.width; j++)
                    self.grid[i][j] = 0;
            }

            _.each(self.collisions, function(index) {
                var position = self.indexToGridPosition(index + 1);
                self.grid[position.y][position.x] = 1;
            });

            _.each(self.blocking, function(index) {
                var position = self.indexToGridPosition(index + 1);

                if (self.grid[position.y])
                    self.grid[position.y][position.x] = 1;
            });
        },

        updateCollisions: function() {
            var self = this;

            _.each(self.collisions, function(index) {
                var position = self.indexToGridPosition(index + 1);

                if (position.x > self.width - 1)
                    position.x = self.width - 1;

                if (position.y > self.height - 1)
                    position.y = self.height - 1;

                self.grid[position.y][position.x] = 1;
            });
        },

        indexToGridPosition: function(index) {
            var self = this;

            index -= 1;

            var x = self.getX(index + 1, self.width),
                y = Math.floor(index / self.width);

            return {
                x: x,
                y: y
            }
        },

        gridPositionToIndex: function(x, y) {
            return (y * this.width) + x + 1;
        },

        isColliding: function(x, y) {
            var self = this;

            if (self.isOutOfBounds(x, y) || !self.grid)
                return false;

            return self.grid[y][x] === 1;
        },

        isObject: function(x, y) {
            var self = this,
                index = self.gridPositionToIndex(x, y) - 1;

            return this.objects.indexOf(index) > -1;
        },

        isHighTile: function(id) {
            return this.high.indexOf(id + 1) > -1;
        },

        isLightTile: function(id) {
            return this.lights.indexOf(id + 1) > -1;
        },

        isAnimatedTile: function(id) {
            return id in this.animatedTiles;
        },

        isOutOfBounds: function(x, y) {
            return isInt(x) && isInt(y) && (x < 0 || x >= this.width || y < 0 || y >= this.height);
        },

        getX: function(index, width) {
            if (index === 0)
                return 0;

            return (index % width === 0) ? width - 1 : (index % width) - 1;
        },

        getTileAnimation: function(id) {
            return this.animatedTiles[id];
        },

        getTilesetFromId: function(id) {
            var self = this;

            for (var idx in self.tilesets)
                if (id > self.tilesets[idx].firstGID - 1 &&
                    id < self.tilesets[idx].lastGID + 1)
                    return self.tilesets[idx];

            return null;
        },

        saveRegionData: function() {
            var self = this;

            self.game.storage.setRegionData(self.data, self.collisions);
        },

        loadRegionData: function() {
            var self = this,
                regionData = self.game.storage.getRegionData(),
                collisions = self.game.storage.getCollisions();

            if (regionData.length < 1)
                return;

            self.preloadedData = true;

            self.data = regionData;
            self.collisions = collisions;

            self.updateCollisions();
        },

        onReady: function(callback) {
            this.readyCallback = callback;
        }

    });

});
