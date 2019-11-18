/* global log, _ */

define(['jquery'], function($) {
    return Class.extend({
        init: function(game) {
            var self = this;

            self.game = game;
            self.renderer = self.game.renderer;
            self.supportsWorker = self.game.app.hasWorker();

            self.data = [];
            self.tilesets = [];
            self.rawTilesets = [];

            self.grid = null;

            self.tilesetsLoaded = false;
            self.mapLoaded = false;

            self.preloadedData = false;

            self.load();

            self.ready();
        },

        ready: function() {
            var self = this,
                rC = function() {
                    if (self.readyCallback) self.readyCallback();
                };

            if (self.mapLoaded && self.tilesetsLoaded) rC();
            else {
                setTimeout(function() {
                    self.loadTilesets();
                    self.ready();
                }, 50);
            }
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
                };
            } else {
                if (self.game.isDebug()) log.info('Parsing map with Ajax...');

                $.get(
                    'data/maps/map.json',
                    function(data) {
                        self.parseMap(data);
                        self.loadCollisions();
                        self.mapLoaded = true;
                    },
                    'json'
                );
            }
        },

        synchronize: function(tileData) {
            var self = this;
            // Use traditional for-loop instead of _

            for (var i = 0; i < tileData.length; i++) {
                var tile = tileData[i],
                    collisionIndex = self.collisions.indexOf(tile.index);

                self.data[tile.index] = tile.data;

                if (tile.isCollision && collisionIndex < 0)
                    // Adding new collision tileIndex
                    self.collisions.push(tile.index);

                if (!tile.isCollision && collisionIndex > 0) {
                    // Removing existing collision tileIndex
                    var position = self.indexToGridPosition(tile.index + 1);

                    self.collisions.splice(collisionIndex, 1);

                    self.grid[position.y][position.x] = 0;
                }
            }

            self.saveRegionData();
        },

        loadTilesets: function() {
            var self = this;

            if (self.rawTilesets.length < 1) return;

            _.each(self.rawTilesets, function(rawTileset) {
                self.tilesets.push(
                    self.loadTileset(
                        'img/tilesets/' + rawTileset.imageName,
                        rawTileset
                    )
                );
            });

            self.tilesetsLoaded = true;
        },

        loadTileset: function(path, rawTileset) {
            var self = this,
                tileset = new Image();

            tileset.crossOrigin = 'Anonymous';
            tileset.src = path;
            tileset.raw = tileset;
            tileset.firstGID = rawTileset.firstGID;
            tileset.lastGID = rawTileset.lastGID;
            tileset.loaded = true;
            tileset.scale = rawTileset.scale;

            tileset.onload = function() {
                if (tileset.width % self.tileSize > 0) {
                    throw Error(
                        'The tile size is malformed in the tile set: ' + path
                    );
                }
            };

            return tileset;
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

            for (var i = 0; i < self.width * self.height - 20; i++)
                self.data.push(0);
        },

        loadCollisions: function() {
            var self = this;

            self.grid = [];

            for (var i = 0; i < self.height; i++) {
                self.grid[i] = [];
                for (var j = 0; j < self.width; j++) self.grid[i][j] = 0;
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

                if (position.x > self.width - 1) position.x = self.width - 1;

                if (position.y > self.height - 1) position.y = self.height - 1;

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
            };
        },

        gridPositionToIndex: function(x, y) {
            return y * this.width + x + 1;
        },

        isColliding: function(x, y) {
            var self = this;

            if (self.isOutOfBounds(x, y) || !self.grid) return false;

            return self.grid[y][x] === 1;
        },

        isHighTile: function(id) {
            return this.high.indexOf(id + 1) > -1;
        },

        isLightTile: function(id) {
            return this.lights.indexOf(id + 1) > -1;
        },

        isAnimatedTile: function(id) {
            return id + 1 in this.animatedTiles;
        },

        isOutOfBounds: function(x, y) {
            return (
                isInt(x) &&
                isInt(y) &&
                (x < 0 || x >= this.width || y < 0 || y >= this.height)
            );
        },

        getX: function(index, width) {
            if (index === 0) return 0;

            return index % width === 0 ? width - 1 : (index % width) - 1;
        },

        getTileAnimation: function(id) {
            return this.animatedTiles[id + 1];
        },

        getTilesetFromId: function(id) {
            var self = this;

            for (var idx in self.tilesets) {
                if (
                    id > self.tilesets[idx].firstGID - 1 &&
                    id < self.tilesets[idx].lastGID + 1
                )
                    return self.tilesets[idx];
            }

            return null;
        },

        saveRegionData() {
            var self = this;

            self.game.storage.setRegionData(self.data, self.collisions);
        },

        loadRegionData() {
            var self = this,
                regionData = self.game.storage.getRegionData(),
                collisions = self.game.storage.getCollisions();

            if (regionData.length < 1) return;

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
