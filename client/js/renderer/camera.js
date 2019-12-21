/* global Modules, log */

define(function() {

    return Class.extend({

        init: function(renderer) {
            var self = this;

            self.renderer = renderer;
            self.map = renderer.map;
            self.app = renderer.game.app;

            self.offset = 0.5;
            self.x = 0;
            self.y = 0;

            self.dX = 0;
            self.dY = 0;

            self.gridX = 0;
            self.gridY = 0;

            self.prevGridX = 0;
            self.prevGridY = 0;

            self.tileSize = self.renderer.tileSize;

            self.speed = 1;
            self.panning = false;
            self.centered = true;
            self.player = null;

            self.lockX = false;
            self.lockY = false;

            self.update();
        },

        update: function() {
            var self = this,
                scale = self.renderer.getScale(),
                borderWidth = self.app.border.width(),
                borderHeight = self.app.border.height(),
                factorWidth = Math.ceil(borderWidth / self.tileSize / scale),
                factorHeight = Math.ceil(borderHeight / self.tileSize / scale);

            self.gridWidth = factorWidth;
            self.gridHeight = factorHeight;

            self.borderX = (self.map.width * self.tileSize) - self.gridWidth * self.tileSize;
            self.borderY = (self.map.height * self.tileSize) - self.gridHeight * self.tileSize;
        },

        setPosition: function(x, y) {
            var self = this;

            self.x = x;
            self.y = y;

            self.prevGridX = self.gridX;
            self.prevGridY = self.gridY;

            self.gridX = Math.floor(x / 16);
            self.gridY = Math.floor(y / 16);
        },

        clip: function() {
            this.setGridPosition(Math.round(this.x / 16), Math.round(this.y / 16));
        },

        center: function() {
            var self = this;

            if (self.centered)
                return;

            self.centered = true;
            self.centreOn(self.player);

            self.renderer.verifyCentration();
        },

        decenter: function() {
            var self = this;

            if (!self.centered)
                return;

            self.clip();
            self.centered = false;

            self.renderer.verifyCentration();
        },

        setGridPosition: function(x, y) {
            var self = this;

            self.prevGridX = self.gridX;
            self.prevGridY = self.gridY;

            self.gridX = x;
            self.gridY = y;

            self.x = self.gridX * 16;
            self.y = self.gridY * 16;
        },

        setPlayer: function(player) {
            var self = this;

            self.player = player;

            self.centreOn(self.player);
        },

        handlePanning: function(direction) {
            var self = this;

            if (!self.panning)
                return;

            switch (direction) {
                case Modules.Keys.Up:
                    self.setPosition(self.x, self.y - 1);
                    break;

                case Modules.Keys.Down:
                    self.setPosition(self.x, self.y + 1);
                    break;

                case Modules.Keys.Left:
                    self.setPosition(self.x - 1, self.y);
                    break;

                case Modules.Keys.Right:
                    self.setPosition(self.x + 1, self.y);
                    break;
            }
        },

        centreOn: function(entity) {
            var self = this;

            if (!entity)
                return;

            var width = Math.floor(self.gridWidth / 2),
                height = Math.floor(self.gridHeight / 2),
                nextX = entity.x - (width * self.tileSize),
                nextY = entity.y - (height * self.tileSize);

            if (nextX >= 0 && nextX <= self.borderX && !self.lockX) {
                self.x = nextX;
                self.gridX = Math.round(entity.x / 16) - width;
            } else
                self.offsetX(nextX);

            if (nextY >= 0 && nextY <= self.borderY && !self.lockY) {
                self.y = nextY;
                self.gridY = Math.round(entity.y / 16) - height;
            } else
                self.offsetY(nextY);

        },

        forceCentre: function(entity) {
            var self = this;

            if (!entity)
                return;

            var width = Math.floor(self.gridWidth / 2),
                height = Math.floor(self.gridHeight / 2);

            self.x = entity.x - (width * self.tileSize);
            self.gridX = Math.round(entity.x / 16) - width;

            self.y = entity.y - (height * self.tileSize);
            self.gridY = Math.round(entity.y / 16) - height;
        },

        offsetX: function(nextX) {
            var self = this;

            if (nextX <= 16) {
                self.x = 0;
                self.gridX = 0;
            } else if (nextX >= self.borderX) {
                self.x = self.borderX;
                self.gridX = Math.round(self.borderX / 16);
            }
        },

        offsetY: function(nextY) {
            var self = this;

            if (nextY <= 16) {
                self.y = 0;
                self.gridY = 0;
            } else if (nextY >= self.borderY) {
                self.y = self.borderY;
                self.gridY = Math.round(self.borderY / 16);
            }
        },

        zone: function(direction) {
            var self = this;

            switch (direction) {
                case Modules.Orientation.Up:

                    self.setGridPosition(self.gridX, self.gridY - self.gridHeight + 3);

                    break;

                case Modules.Orientation.Down:

                    self.setGridPosition(self.gridX, self.gridY + self.gridHeight - 3);

                    break;

                case Modules.Orientation.Right:

                    self.setGridPosition(self.gridX + self.gridWidth - 3, self.gridY);

                    break;

                case Modules.Orientation.Left:

                    self.setGridPosition(self.gridX - self.gridWidth + 3, self.gridY);

                    break;
            }

            self.zoneClip();
        },

        zoneClip: function() {
            var self = this;

            /**
             * Clip the map to the boundaries of the map if
             * we zone somewhere out of the limitations.
             */

            if (self.gridX < 0)
                self.setGridPosition(0, self.gridY);

            if (self.gridX > self.map.width)
                self.setGridPosition(self.map.width, self.gridY);

            if (self.gridY < 0)
                self.setGridPosition(self.gridX, 0);

            if (self.gridY > self.map.height)
                self.setGridPosition(self.gridX, self.map.height);
        },

        forEachVisiblePosition: function(callback, offset) {
            var self = this;

            if (!offset)
                offset = 1;

            for(var y = self.gridY - offset, maxY = y + self.gridHeight + (offset * 2); y < maxY; y++)
                for(var x = self.gridX - offset, maxX = x + self.gridWidth + (offset * 2); x < maxX; x++)
                    callback(x, y);
        },

        isVisible: function(x, y, offset, offset2) {
            return x > this.gridX - offset &&
                    x < this.gridX + this.gridWidth &&
                    y > this.gridY - offset &&
                    y < this.gridY + this.gridHeight + offset2;
        }

    });

});
