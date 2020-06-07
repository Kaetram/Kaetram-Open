/* global log */

define(function() {

    return Class.extend({

        init: function(map) {
            var self = this;

            self.map = map;

            self.renderingGrid = [];
            self.pathingGrid = [];
            self.itemGrid = [];

            self.load();
        },

        load: function() {
            var self = this;

            for (var i = 0; i < self.map.height; i++) {
                self.renderingGrid[i] = [];
                self.pathingGrid[i] = [];
                self.itemGrid[i] = [];

                for (var j = 0; j < self.map.width; j++) {
                    self.renderingGrid[i][j] = {};
                    self.pathingGrid[i][j] = self.map.grid[i][j];
                    self.itemGrid[i][j] = {};
                }
            }

            if (self.map.game.isDebug())
                log.info('Finished generating grids.');
        },

        resetPathingGrid: function() {
            var self = this;

            self.pathingGrid = [];

            for (var i = 0; i < self.map.height; i++) {
                self.pathingGrid[i] = [];

                for (var j = 0; j < self.map.width; j++)
                    self.pathingGrid[i][j] = self.map.grid[i][j];

            }
        },

        addToRenderingGrid: function(entity, x, y) {
            var self = this;

            if (!self.map.isOutOfBounds(x, y))
                self.renderingGrid[y][x][entity.id] = entity;
        },

        addToPathingGrid: function(x, y) {
            this.pathingGrid[y][x] = 1;
        },

        addToItemGrid: function(item, x, y) {
            var self = this;

            if (item && self.itemGrid[y][x])
                self.itemGrid[y][x][item.id] = item;
        },

        removeFromRenderingGrid: function(entity, x, y) {
            var self = this;

            if (entity && self.renderingGrid[y][x] && entity.id in self.renderingGrid[y][x])
                delete self.renderingGrid[y][x][entity.id];
        },

        removeFromPathingGrid: function(x, y) {
            this.pathingGrid[y][x] = 0;
        },

        removeFromMapGrid: function(x, y) {
            this.map.grid[y][x] = 0;
        },

        removeFromItemGrid: function(item, x, y) {
            var self = this;

            if (item && self.itemGrid[y][x][item.id])
                delete self.itemGrid[y][x][item.id];
        },

        removeEntity: function(entity) {
            var self = this;

            if (entity) {
                self.removeFromPathingGrid(entity.gridX, entity.gridY);
                self.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);

                if (entity.nextGridX > -1 && entity.nextGridY > -1) {
                    self.removeFromPathingGrid(entity.nextGridX, entity.nextGridY);
                }
            }
        }

    });

});
