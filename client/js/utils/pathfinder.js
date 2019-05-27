/* global _, log */

define(['../lib/astar'], function(AStar) {

    return Class.extend({

        init: function(width, height) {
            var self = this;

            self.width = width;
            self.height = height;

            self.grid = null;
            self.blankGrid = [];
            self.ignores = [];

            self.load();
        },

        load: function() {
            var self = this;

            for (var i = 0; i < self.height; i++) {
                self.blankGrid[i] = [];

                for (var j = 0; j < self.width; j++)
                    self.blankGrid[i][j] = 0;
            }

            log.info('Sucessfully loaded the pathfinder!');
        },

        find: function(grid, entity, x, y, incomplete) {
            var self = this,
                start = [entity.gridX, entity.gridY],
                end = [x, y], path;

            self.grid = grid;
            self.applyIgnore(true);

            path = AStar(self.grid, start, end);

            if (path.length === 0 && incomplete)
                path = self.findIncomplete(start, end);

            return path;
        },

        findIncomplete: function(start, end) {
            var self = this,
                incomplete = [],
                perfect, x, y;

            perfect = AStar(self.blankGrid, start, end);

            for (var i = perfect.length - 1; i > 0; i--) {
                x = perfect[i][0];
                y = perfect[i][1];

                if (self.grid[y][x] === 0) {
                    incomplete = AStar(self.grid, start, [x. y]);
                    break;
                }
            }

            return incomplete;
        },

        applyIgnore: function(ignored) {
            var self = this,
                x, y, g;

            _.each(self.ignores, function(entity) {
                x = entity.hasPath() ? entity.nextGridX : entity.gridX;
                y = entity.hasPath() ? entity.nextGridY : entity.gridY;

                if (x >= 0 && y >= 0)
                    self.grid[y][x] = ignored ? 0 : 1
            });
        },

        ignoreEntity: function(entity) {
            var self = this;

            if (!entity)
                return;

            self.ignores.push(entity);
        },

        clearIgnores: function() {
            var self = this;

            self.applyIgnore(false);
            self.ignores = [];
        }

    });

});