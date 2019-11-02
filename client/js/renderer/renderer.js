/* global _, m4, log, Detect */

var DarkMask = illuminated.DarkMask,
    Lamp = illuminated.Lamp,
    Lighting = illuminated.Lighting,
    Vec2 = illuminated.Vec2;

define(['jquery', './camera', './tile',
    '../entity/character/player/player', '../entity/character/character',
    '../entity/objects/item'], function($, Camera, Tile, Player, Character, Item) {

    return Class.extend({

        init: function(background, entities, foreground, overlay, textCanvas, cursor, game) {
            var self = this;

            self.canvas = document.getElementById('canvas');
            self.background = background;
            self.entities = entities;
            self.foreground = foreground;
            self.overlay = overlay;
            self.textCanvas = textCanvas;
            self.cursor = cursor;

            self.context = self.entities.getContext('2d');
            self.backContext = self.background.getContext('2d');
            self.foreContext = self.foreground.getContext('2d');
            self.overlayContext = self.overlay.getContext('2d');
            self.textContext = self.textCanvas.getContext('2d');
            self.cursorContext = self.cursor.getContext('2d');

            self.contexts = [self.context, self.backContext, self.foreContext];
            self.canvases = [self.background, self.entities, self.foreground, self.overlay, self.textCanvas, self.cursor];

            self.allContexts = [self.context, self.backContext, self.foreContext, self.overlayContext,
                self.textContext, self.cursorContext];

            self.context.imageSmoothingEnabled = false;
            self.backContext.imageSmoothingEnabled = false;
            self.foreContext.imageSmoothingEnabled = false;
            self.overlayContext.imageSmoothingEnabled = false;
            self.textContext.imageSmoothingEnabled = false;
            self.cursorContext.imageSmoothingEnabled = false;

            self.lightings = [];
            self.textures = {};

            self.game = game;
            self.camera = null;
            self.entities = null;
            self.input = null;

            self.checkDevice();

            self.tileSize = 16;
            self.fontSize = 10;

            self.screenWidth = 0;
            self.screenHeight = 0;

            self.time = new Date();

            self.fps = 0;
            self.frameCount = 0;
            self.renderedFrame = [0, 0];
            self.lastTarget = [0, 0];

            self.animatedTiles = [];
            self.drawnTiles = [];

            self.resizeTimeout = null;
            self.autoCentre = false;

            self.drawTarget = false;
            self.selectedCellVisible = false;

            self.stopRendering = false;
            self.animateTiles = true;
            self.debugging = false;
            self.brightness = 100;
            self.drawNames = true;
            self.drawLevels = true;
            self.forceRendering = false;

            self.load();
        },

        stop: function() {
            var self = this;

            self.camera = null;
            self.input = null;
            self.stopRendering = true;

            self.forEachContext(function(context) {
                context.fillStyle = '#12100D';
                context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            })
        },

        load: function() {
            var self = this;

            self.scale = self.getScale();
            self.superScaling = self.getSuperScaling();

            self.loadLights();
            self.handleScaling();
        },

        removeSmoothing: function() {
            var self = this;

            self.forAllContexts(function(context) {
                context.imageSmoothingQuality = 'low';

                context.imageSmoothingEnabled = false;
                context.webkitImageSmoothingEnabled = false;
                context.mozImageSmoothingEnabled = false;
                context.msImageSmoothingEnabled = false;
                context.oImageSmoothingEnabled = false;
            });
        },

        loadSizes: function() {
            var self = this;

            if (!self.camera)
                return;

            self.lightTileSize = self.tileSize * self.superScaling;

            self.screenWidth = self.camera.gridWidth * self.tileSize;
            self.screenHeight = self.camera.gridHeight * self.tileSize;

            var width = self.screenWidth * self.superScaling,
                height = self.screenHeight * self.superScaling;

            self.forEachCanvas(function(canvas) {
                canvas.width = width;
                canvas.height = height;
            });
        },

        loadCamera: function() {
            var self = this,
                storage = self.game.storage;

            self.camera = new Camera(this);

            self.loadSizes();

            if (storage.data.new && (self.firefox || parseFloat(Detect.androidVersion()) < 6.0 || parseFloat(Detect.iOSVersion() < 9.0) || Detect.isIpad())) {
                self.camera.centered = false;

                storage.data.settings.centerCamera = false;
                storage.save();
            }
        },

        loadLights: function() {
            var self = this;

            self.darkMask = new DarkMask({
                lights: [],
                color: 'rgba(0, 0, 0, 0.84)'
            });

            self.darkMask.compute(self.overlay.width, self.overlay.height);
        },

        resize: function() {
            var self = this;

            self.stopRendering = true;

            self.clearAll();

            self.checkDevice();

            if (!self.resizeTimeout)
                self.resizeTimeout = setTimeout(function() {

                    self.scale = self.getScale();
                    self.clearScreen(self.cursorContext);

                    if (self.camera)
                        self.camera.update();

                    self.loadSizes();

                    if (self.entities)
                        self.entities.update();

                    if (self.camera)
                        self.camera.centreOn(self.game.player);

                    if (self.game.interface)
                        self.game.interface.resize();

                    self.stopRendering = false;
                    self.resizeTimeout = null;

                    self.updateAnimatedTiles();

                }, 500);
        },

        render: function() {
            var self = this;

            if (self.stopRendering)
                return;

            self.clear();

            self.clearText();

            self.saveAll();

            self.removeSmoothing();

            /**
             * Rendering related draws
             */

            self.draw();

            self.drawOverlays();

            self.drawTargetCell();

            self.drawSelectedCell();

            self.drawEntities();

            self.drawInfos();

            self.drawDebugging();

            self.drawCursor();

            self.calculateFPS();

            self.restoreAll();

        },

        /**
         * Context Drawing
         */

        draw: function() {
            var self = this;

            self.updateDrawingView();

            self.forEachVisibleTile(function(id, index) {
                var isHighTile = self.map.isHighTile(id),
                    isLightTile = self.map.isLightTile(id),
                    context = isLightTile ? self.overlayContext :
                        (isHighTile ? self.foreContext : self.backContext);

                if (!self.map.isAnimatedTile(id) || !self.animateTiles)
                    self.drawTile(context, id, self.map.width, index);
            });

            if (self.animateTiles)
                self.forEachAnimatedTile(function(tile) {
                    self.drawTile(self.backContext, tile.id, self.map.width, tile.index);
                    tile.loaded = true;
                });

        },

        drawOverlays: function() {
            var self = this,
                overlay = self.game.overlays.getFog();

            if (overlay) {
                self.overlayContext.save();

                if (overlay !== 'empty') {

                    self.overlayContext.fillStyle = self.overlayContext.createPattern(overlay, 'repeat');
                    self.overlayContext.fillRect(0, 0, self.screenWidth * self.superScaling, self.screenHeight * self.superScaling);
                    self.overlayContext.fill();
                }

                self.overlayContext.globalCompositeOperation = 'lighter';

                self.forEachLighting(function(lighting) {
                    if (self.inRadius(lighting))
                        self.drawLighting(lighting);
                });

                self.overlayContext.globalCompositeOperation = 'source-over';
                self.darkMask.render(self.overlayContext);

                self.overlayContext.restore();
            }
        },

        drawInfos: function() {
            var self = this;

            if (self.game.info.getCount() === 0)
                return;

            self.game.info.forEachInfo(function(info) {
                self.textContext.save();
                self.textContext.font = '20px AdvoCut';
                self.setCameraView(self.textContext);
                self.textContext.globalAlpha = info.opacity;
                self.drawText('' + info.text, Math.floor((info.x + 8)), Math.floor(info.y), true, info.fill, info.stroke);
                self.textContext.restore();
            });
        },

        drawDebugging: function() {
            var self = this;

            if (!self.debugging)
                return;

            self.drawFPS();

            if (!self.mobile) {
                self.drawPosition();
                self.drawCollisions();
            }

            self.drawPathing();
        },

        drawEntities: function() {
            var self = this;

            self.forEachVisibleEntity(function(entity) {
                if (entity.spriteLoaded)
                    self.drawEntity(entity);
            });
        },

        drawEntity: function(entity) {
            var self = this,
                sprite = entity.sprite,
                animation = entity.currentAnimation,
                data = entity.renderingData;

            if (!sprite || !animation || !entity.isVisible())
                return;

            var frame = animation.currentFrame,
                x = frame.x * self.superScaling,
                y = frame.y * self.superScaling,
                dx = entity.x * self.superScaling,
                dy = entity.y * self.superScaling,
                flipX = dx + self.tileSize * self.superScaling,
                flipY = dy + data.height;

            self.context.save();
            self.setCameraView(self.context);

            if (entity.id !== self.game.player.id)
                self.context.globalCompositeOperation = 'destination-over';

            if (data.scale !== self.scale || data.sprite !== sprite) {

                data.scale = self.scale;
                data.sprite = sprite;

                data.width = sprite.width * self.superScaling;
                data.height = sprite.height * self.superScaling;
                data.ox = sprite.offsetX * self.superScaling;
                data.oy = sprite.offsetY * self.superScaling;

                if (entity.angled)
                    data.angle = entity.angle * Math.PI / 180;

                if (entity.hasShadow()) {
                    data.shadowWidth = self.shadowSprite.width * self.superScaling;
                    data.shadowHeight = self.shadowSprite.height * self.superScaling;

                    data.shadowOffsetY = entity.shadowOffsetY * self.superScaling;
                }

            }

            if (entity.fading)
                self.context.globalAlpha = entity.fadingAlpha;

            if (entity.spriteFlipX) {
                self.context.translate(flipX, dy);
                self.context.scale(-1, 1);
            } else if (entity.spriteFlipY) {
                self.context.translate(dx, flipY);
                self.context.scale(1, -1);
            } else
                self.context.translate(dx, dy);

            if (entity.angled)
                self.context.rotate(data.angle);

            if (entity.hasShadow()) {
                self.context.globalCompositeOperation = 'source-over';

                self.context.drawImage(self.shadowSprite.image, 0, 0, data.shadowWidth, data.shadowHeight,
                    0, data.shadowOffsetY, data.shadowWidth, data.shadowHeight);
            }

            self.drawEntityBack(entity);

            self.context.drawImage(sprite.image, x, y, data.width, data.height, data.ox, data.oy, data.width, data.height);

            if (entity instanceof Character && !entity.dead && !entity.teleporting && entity.hasWeapon()) {
                var weapon = self.entities.getSprite(entity.weapon.getString());

                if (weapon) {
                    if (!weapon.loaded)
                        weapon.load();

                    var weaponAnimationData = weapon.animationData[animation.name],
                        index = frame.index < weaponAnimationData.length ? frame.index : frame.index % weaponAnimationData.length,
                        weaponX = weapon.width * index * self.superScaling,
                        weaponY = weapon.height * animation.row * self.superScaling,
                        weaponWidth = weapon.width * self.superScaling,
                        weaponHeight = weapon.height * self.superScaling;

                    self.context.drawImage(weapon.image, weaponX, weaponY, weaponWidth, weaponHeight,
                        weapon.offsetX * self.superScaling, weapon.offsetY * self.superScaling,
                        weaponWidth, weaponHeight);
                }
            }

            if (entity instanceof Item) {

                var sparksAnimation = self.entities.sprites.sparksAnimation,
                    sparksFrame = sparksAnimation.currentFrame;

                if (data.scale !== self.scale) {

                    data.sparksX = self.sparksSprite.width * sparksFrame.index * self.superScaling;
                    data.sparksY = self.sparksSprite.height * sparksAnimation.row * self.superScaling;

                    data.sparksWidth = self.sparksSprite.width * self.superScaling;
                    data.sparksHeight = self.sparksSprite.height * self.superScaling;
                }

                self.context.drawImage(self.sparksSprite.image, data.sparksX, data.sparksY, data.sparksWidth, data.sparksHeight,
                    0, 0, data.sparksWidth, data.sparksHeight);
            }

            self.drawEntityFore(entity);

            self.context.restore();

            self.drawHealth(entity);

            if (!self.game.overlays.getFog())
                self.drawName(entity);
        },

        drawEntityBack: function(entity) {
            var self = this;

            /**
             * Function used to draw special effects prior
             * to rendering the entity.
             */

        },

        drawEntityFore: function(entity) {
            var self = this;

            /**
             * Function used to draw special effects after
             * having rendererd the entity
             */

            if (entity.terror || entity.stunned || entity.critical || entity.explosion) {
                var sprite = self.entities.getSprite(entity.getActiveEffect());

                if (!sprite.loaded)
                    sprite.load();

                if (sprite) {
                    var animation = entity.getEffectAnimation(),
                        index = animation.currentFrame.index,
                        x = sprite.width * index * self.superScaling,
                        y = sprite.height * animation.row * self.superScaling,
                        width = sprite.width * self.superScaling,
                        height = sprite.height * self.superScaling,
                        offsetX = sprite.offsetX * self.superScaling,
                        offsetY = sprite.offsetY * self.superScaling;

                    self.context.drawImage(sprite.image, x, y, width, height, offsetX, offsetY, width, height);
                }
            }

        },

        drawHealth: function(entity) {
            var self = this;

            if (!entity.hitPoints || entity.hitPoints < 0 || !entity.healthBarVisible)
                return;

            var barLength = 16,
                healthX = entity.x * self.superScaling - barLength / 2 + 8,
                healthY = (entity.y - 9) * self.superScaling,
                healthWidth = Math.round(entity.hitPoints / entity.maxHitPoints * barLength * self.superScaling),
                healthHeight = 2 * self.superScaling;

            self.context.save();
            self.setCameraView(self.context);
            self.context.strokeStyle = '#00000';
            self.context.lineWidth = 1;
            self.context.strokeRect(healthX, healthY, barLength * self.superScaling, healthHeight);
            self.context.fillStyle = '#FD0000';
            self.context.fillRect(healthX, healthY, healthWidth, healthHeight);
            self.context.restore();
        },

        drawName: function(entity) {
            var self = this;

            if (entity.hidden || (!self.drawNames && !self.drawLevels))
                return;

            var colour = entity.wanted ? 'red' : 'white';

            if (entity.rights > 1)
                colour = '#ba1414';
            else if (entity.rights > 0)
                colour = '#a59a9a';

            if (entity.id === self.game.player.id)
                colour = '#fcda5c';

            self.textContext.save();
            self.setCameraView(self.textContext);
            self.textContext.font = '11px AdvoCut';

            if (entity.drawNames()) {
                if (!entity.hasCounter) {

                    if (self.drawNames && (entity.type === 'mob' || entity.type === 'player'))
                        self.drawText(entity.type === 'player' ? entity.username : entity.name, (entity.x + 8), (entity.y - (self.drawLevels ? 20 : 10)), true, colour, '#000');

                    if (self.drawLevels && (entity.type === 'mob' || entity.type === 'player'))
                        self.drawText('Level ' + entity.level, (entity.x + 8), (entity.y - (entity.type === 'player' ? 12 : 10)), true, colour, '#000');

                    if (entity.type === 'item' && entity.count > 1)
                        self.drawText(entity.count, (entity.x + 8), (entity.y - 10), true, colour);

                } else {

                    if (self.game.time - entity.countdownTime > 1000) {
                        entity.countdownTime = self.game.time;
                        entity.counter--;
                    }

                    if (entity.counter <= 0)
                        entity.hasCounter = false;

                    self.drawText(entity.counter, (entity.x + 8), (entity.y - 10), true, colour);
                }
            }

            self.textContext.restore();
        },

        drawLighting: function(lighting) {
            var self = this;

            if (lighting.relative) {
                var lightX = (lighting.light.origX - (self.camera.x / 16)) * self.lightTileSize,
                    lightY = (lighting.light.origY - (self.camera.y / 16)) * self.lightTileSize;

                lighting.light.position = new Vec2(lightX, lightY);
                lighting.compute(self.overlay.width, self.overlay.height);
                self.darkMask.compute(self.overlay.width, self.overlay.height);
            } else if (!lighting.computed) {
                lighting.compute(self.overlay.width, self.overlay.height);
                lighting.computed = true;
            }

            lighting.render(self.overlayContext);
        },

        drawCursor: function() {
            var self = this;

            if (self.tablet || self.mobile || self.hasRenderedMouse() || self.input.cursorMoved)
                return;

            var cursor = self.input.cursor,
                scaling = 14 * self.superScaling;

            self.clearScreen(self.cursorContext);
            self.cursorContext.save();

            if (cursor && self.scale > 1) {
                if (!cursor.loaded)
                    cursor.load();

                if (cursor.loaded)
                    self.cursorContext.drawImage(cursor.image, 0, 0, scaling, scaling,
                        self.input.mouse.x, self.input.mouse.y,
                        scaling, scaling);
            }

            self.cursorContext.restore();

            self.saveMouse();
        },

        calculateFPS: function() {
            var self = this;

            if (!self.debugging)
                return;

            var currentTime = new Date(),
                timeDiff = currentTime - self.time;

            if (timeDiff >= 1000) {
                self.realFPS = self.frameCount;
                self.frameCount = 0;
                self.time = currentTime;
                self.fps = self.realFPS;
            }

            self.frameCount++;
        },

        drawFPS: function() {
            this.drawText('FPS: ' + this.realFPS, 10, 11, false, 'white');
        },

        drawPosition: function() {
            var self = this,
                player = self.game.player;

            self.drawText('x: ' + player.gridX + ' y: ' + player.gridY, 10, 31, false, 'white');
        },

        drawCollisions: function() {
            var self = this,
                pathingGrid = self.entities.grids.pathingGrid;

            if (!pathingGrid)
                return;

            self.camera.forEachVisiblePosition(function(x, y) {
                if (x < 0 || y < 0 || x > self.map.width - 1 || y > self.map.height - 1)
                    return;

                if (pathingGrid[y][x] !== 0)
                    self.drawCellHighlight(x, y, 'rgba(50, 50, 255, 0.5)');
            });
        },

        drawPathing: function() {
            var self = this;

            if (!self.game.player.hasPath())
                return;

            _.each(self.game.player.path, function(path) {
                self.drawCellHighlight(path[0], path[1], 'rgba(50, 255, 50, 0.5)');
            });

        },

        drawSelectedCell: function() {
            var self = this;

            if (!self.input.selectedCellVisible || self.input.keyMovement)
                return;

            var posX = self.input.selectedX,
                posY = self.input.selectedY,
                tD = self.input.getTargetData(); // target data

            if (tD) {
                self.context.save();
                self.setCameraView(self.context);

                self.context.drawImage(tD.sprite.image, tD.x, tD.y, tD.width, tD.height, tD.dx, tD.dy, tD.dw, tD.dh);

                self.context.restore();
            }

        },

        /**
         * Primitive drawing functions
         */

        drawTile: function(context, tileId, gridWidth, cellId) {
            var self = this;

            if (tileId < 0)
                return;

            var tileset = self.map.getTilesetFromId(tileId);

            if (!tileset)
                return;

            tileId -= tileset.firstGID - 1;

            var setWidth = tileset.width / self.tileSize / tileset.scale;

            self.drawScaledImage(context, tileset,
                self.getX(tileId + 1, setWidth) * self.tileSize,
                Math.floor(tileId / setWidth) * self.tileSize,
                self.tileSize, self.tileSize,
                self.getX(cellId + 1, gridWidth) * self.tileSize,
                Math.floor(cellId / gridWidth) * self.tileSize);
        },

        drawScaledImage: function(context, image, x, y, width, height, dx, dy) {
            var self = this,
                tilesetScale = image.scale,
                scale = self.superScaling;

            if (!context)
                return;

            context.drawImage(image,
                x * tilesetScale, // Source X
                y * tilesetScale, // Source Y
                width * tilesetScale, // Source Width
                height * tilesetScale, // Source Height
                dx * scale, // Destination X
                dy * scale, // Destination Y
                width * scale, // Destination Width
                height * scale); // Destination Height
        },

        drawText: function(text, x, y, centered, colour, strokeColour) {
            var self = this,
                strokeSize = 1,
                context = self.textContext;

            if (self.scale > 2)
                strokeSize = 3;

            if (text && x && y) {
                context.save();

                if (centered)
                    context.textAlign = 'center';

                context.strokeStyle = strokeColour || '#373737';
                context.lineWidth = strokeSize;
                context.strokeText(text, x * self.superScaling, y * self.superScaling);
                context.fillStyle = colour || 'white';
                context.fillText(text, x * self.superScaling, y * self.superScaling);

                context.restore()
            }
        },

        updateAnimatedTiles: function() {
            var self = this;

            if (!self.animateTiles)
                return;

            var newTiles = [];

            self.forEachVisibleTile(function(id, index) {
                /**
                 * We don't want to reinitialize animated tiles that already exist
                 * and are within the visible camera proportions. This way we can parse
                 * it every time the tile moves slightly.
                 */

                if (!self.map.isAnimatedTile(id))
                    return;

                /**
                 * Push the pre-existing tiles.
                 */

                var tileIndex = self.animatedTiles.indexOf(id);

                if (tileIndex > -1) {
                    newTiles.push(self.animatedTiles[tileIndex]);
                    return;
                }

                var tile = new Tile(id, index, self.map),
                    position = self.map.indexToGridPosition(tile.index);

                tile.setPosition(position);

                newTiles.push(tile);
            }, 2);

            self.animatedTiles = newTiles;
        },

        drawCellRect: function(x, y, colour) {
            var self = this,
                multiplier = self.tileSize * self.superScaling;

            self.context.save();
            self.setCameraView(self.context);

            self.context.lineWidth = 2 * self.superScaling;

            self.context.translate(x + 2, y + 2);

            self.context.strokeStyle = colour;
            self.context.strokeRect(0, 0, multiplier - 4, multiplier - 4);

            self.context.restore();
        },

        drawCellHighlight: function(x, y, colour) {
            var self = this;

            self.drawCellRect(x * self.superScaling * self.tileSize, y * self.superScaling * self.tileSize, colour);
        },

        drawTargetCell: function() {
            var self = this;

            if (self.mobile || self.tablet || !self.input.targetVisible || !self.input || !self.camera || !self.map || self.input.keyMovement)
                return;

            var location = self.input.getCoords();

            if (!(location.x === self.input.selectedX && location.y === self.input.selectedY)) {
                var isColliding = self.map.isColliding(location.x, location.y);

                self.drawCellHighlight(location.x, location.y, isColliding ? 'rgba(230, 0, 0, 0.7)' : self.input.targetColour);
            }
        },

        /**
         * Primordial Rendering functions
         */

        forEachVisibleIndex: function(callback, offset) {
            var self = this;

            self.camera.forEachVisiblePosition(function(x, y) {
                if (!self.map.isOutOfBounds(x, y))
                    callback(self.map.gridPositionToIndex(x, y) - 1);
            }, offset);
        },

        forEachVisibleTile: function(callback, offset) {
            var self = this;

            if (!self.map || !self.map.mapLoaded)
                return;

            self.forEachVisibleIndex(function(index) {
                var indexData = self.map.data[index];

                if (Array.isArray(indexData))
                    _.each(indexData, function(id) { callback(id - 1, index) });
                else if (!(isNaN(self.map.data[index] - 1)))
                    callback(self.map.data[index] - 1, index);

            }, offset);
        },

        forEachAnimatedTile: function(callback) {
            _.each(this.animatedTiles, function(tile) {
                callback(tile);
            });
        },

        forEachVisibleEntity: function(callback) {
            var self = this;

            if (!self.entities || !self.camera)
                return;

            var grids = self.entities.grids;

            self.camera.forEachVisiblePosition(function(x, y) {
                if (!self.map.isOutOfBounds(x, y) && grids.renderingGrid[y][x])
                    _.each(grids.renderingGrid[y][x], function(entity) {
                        callback(entity);
                    });
            });
        },

        isVisiblePosition: function(x, y) {
            return y >= this.camera.gridY && y < this.camera.gridY + this.camera.gridHeight &&
                x >= this.camera.gridX && x < this.camera.gridX + this.camera.gridWidth
        },

        getScale: function() {
            return this.game.getScaleFactor();
        },

        getSuperScaling: function() {
            return 2;
        },

        clearContext: function() {
            this.context.clearRect(0, 0, this.screenWidth * this.scale, this.screenHeight * this.scale);
        },

        clearText: function() {
            this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
            this.overlayContext.clearRect(0, 0, this.overlay.width, this.overlay.height);
        },

        restore: function() {
            this.forEachContext(function(context) {
                context.restore();
            });
        },

        clearAll: function() {
            this.forEachContext(function(context) {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            });
        },

        clear: function() {
            this.forEachContext(function(context) {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            });
        },

        handleScaling: function() {
            var self = this;

            /**
             * Using scale factors to zoom canvas may
             * have some adverse performance effects.
             * This is a temporary solution.
             * Eventually, we will have to scale the sprites
             * to 1.5 times their current size to obtain
             * the same effect, with no performance hit. //hopefully
             */

            self.canvas.style.transformOrigin = '0 0';
            self.canvas.style.transform = 'scale(1.5)';
        },

        saveAll: function() {
            this.forEachContext(function(context) {
                context.save();
            });
        },

        restoreAll: function() {
            this.forEachContext(function(context) {
                context.restore();
            });
        },

        isIntersecting: function(rectOne, rectTwo) {
            return (rectTwo.left > rectOne.right || rectTwo.right < rectOne.left || rectTwo.top > rectOne.bottom || rectTwo.bottom < rectOne.top);
        },

        focus: function() {
            this.forEachContext(function(context) {
                context.focus();
            });
        },

        transition: function(duration, forward, callback) {
            var self = this,
                textCanvas = $('#textCanvas'),
                hasThreshold = function() {
                    return forward ? self.brightness > 99 : self.brightness < 1;
                };

            self.transitioning = true;

            self.transitionInterval = setInterval(function() {
                self.brightness += forward ? 6 : -6;

                textCanvas.css('background', 'rgba(0,0,0,' + (1 - (self.brightness / 100)) + ')');

                if (hasThreshold()) {
                    clearInterval(self.transitionInterval);
                    self.transitionInterval = null;

                    self.transitioning = false;

                    callback();
                }
            }, duration);

        },


        /**
         * Rendering Functions
         */

        updateView: function() {
            var self = this;

            self.forEachContext(function(context) {
                self.setCameraView(context);
            });
        },

        updateDrawingView: function() {
            var self = this;

            self.forEachDrawingContext(function(context) {
                self.setCameraView(context);
            });
        },

        setCameraView: function(context) {
            var self = this;

            if (!self.camera || self.stopRendering)
                return;

            context.translate(-self.camera.x * self.superScaling, -self.camera.y * self.superScaling);
        },

        clearScreen: function(context) {
            context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        },

        hasRenderedMouse: function() {
            return this.input.lastMousePosition.x === this.input.mouse.x && this.input.lastMousePosition.y === this.input.mouse.y;
        },

        saveMouse: function() {
            var self = this;

            self.input.lastMousePosition.x = self.input.mouse.x;
            self.input.lastMousePosition.y = self.input.mouse.y;
        },

        adjustBrightness: function(level) {
            var self = this;

            if (level < 0 || level > 100)
                return;

            $('#textCanvas').css('background', 'rgba(0, 0, 0, ' + (0.5 - level / 200) + ')');
        },

        loadStaticSprites: function() {
            var self = this;

            self.shadowSprite = self.entities.getSprite('shadow16');

            if (!self.shadowSprite.loaded)
                self.shadowSprite.load();

            self.sparksSprite = self.entities.getSprite('sparks');

            if (!self.sparksSprite.loaded)
                self.sparksSprite.load();
        },

        hasDrawnTile: function(id) {
            return this.drawnTiles.indexOf(id) > -1;
        },

        /**
         * Miscellaneous functions
         */

        forAllContexts: function(callback) {
            _.each(this.allContexts, function(context) {
                callback(context);
            });
        },

        forEachContext: function(callback) {
            _.each(this.contexts, function(context) {
                callback(context);
            });
        },

        forEachDrawingContext: function(callback) {
            _.each(this.contexts, function(context) {
                if (context.canvas.id !== 'entities')
                    callback(context);
            });
        },

        forEachCanvas: function(callback) {
            _.each(this.canvases, function(canvas) {
                callback(canvas);
            });
        },

        forEachLighting: function(callback) {
            _.each(this.lightings, function(lighting) {
                callback(lighting);
            });
        },

        getX: function(index, width) {
            if (index === 0)
                return 0;

            return (index % width === 0) ? width - 1 : (index % width) - 1;
        },

        checkDevice: function() {
            var self = this;

            self.mobile = Detect.isMobile();
            self.tablet = Detect.isTablet();
            self.firefox = Detect.isFirefox();
        },

        verifyCentration: function() {
            this.forceRendering = (this.mobile || this.tablet) && this.camera.centered;
        },

        isPortableDevice: function() {
            return this.mobile || this.tablet;
        },

        updateDarkMask: function(color) {
            var self = this;

            self.darkMask.color = color;
            self.darkMask.compute(self.overlay.width, self.overlay.height);
        },

        addLight: function(x, y, distance, diffuse, color, relative) {
            var self = this,
                light = new Lamp(self.getLightData(x, y, distance, diffuse, color)),
                lighting = new Lighting({
                    light: light,
                    objects: [],
                    diffuse: light.diffuse
                });

            light.origX = light.position.x;
            light.origY = light.position.y;

            light.diff = Math.round(light.distance / 16);

            if (self.hasLighting(lighting))
                return;

            if (relative)
                lighting.relative = relative;

            self.lightings.push(lighting);
            self.darkMask.lights.push(light);

            self.drawLighting(lighting);
            self.darkMask.compute(self.overlay.width, self.overlay.height);
        },

        removeAllLights: function() {
            var self = this;

            self.lightings = [];
            self.darkMask.lights = [];

            self.darkMask.compute(self.overlay.width, self.overlay.height);
        },

        removeNonRelativeLights: function() {
            var self = this;

            _.each(self.lightings, function(lighting) {
                if (!lighting.light.relative) {
                    self.lightings.splice(i, 1);
                    self.darkMask.lights.splice(i, 1);
                }
            });

            self.darkMask.compute(self.overlay.width, self.overlay.height);
        },

        getLightData: function(x, y, distance, diffuse, color) {
            return {
                position: new Vec2(x, y),
                distance: distance,
                diffuse: diffuse,
                color: color,
                radius: 0,
                samples: 2,
                roughness: 0,
                angle: 0
            }
        },

        hasLighting: function(lighting) {
            var self = this;

            for (var i = 0; i < self.lightings.length; i++) {
                var light = self.lightings[i].light;

                if (lighting.light.origX === light.origX && lighting.light.origY === light.origY &&
                    lighting.light.distance === light.distance)
                    return true;
            }

            return false;
        },

        inRadius: function(lighting) {
            var self = this,
                position = {
                    x: lighting.light.origX,
                    y: lighting.light.origY,
                    diff: lighting.light.diff
                };

            return position.x > self.camera.gridX - position.diff &&
                position.x < self.camera.gridX + self.camera.gridWidth  + position.diff &&
                position.y > self.camera.gridY - position.diff &&
                position.y < self.camera.gridY + self.camera.gridHeight + position.diff;
        },

        getMiddle: function() {
            return {
                x: this.overlay.width / 2,
                y: this.overlay.height / 2
            }
        },

        /**
         * Setters
         */

        setTileset: function(tileset) {
            this.tileset = tileset;
        },

        setMap: function(map) {
            this.map = map;
        },

        setEntities: function(entities) {
            this.entities = entities;
        },

        setInput: function(input) {
            this.input = input;
        },

        /**
         * Getters
         */

        getTargetBounds: function(x, y) {
            var self = this,
                bounds = {},
                tx = x || self.input.selectedX,
                ty = y || self.input.selectedY;

            bounds.x = ((tx * self.tileSize) - self.camera.x) * self.superScaling;
            bounds.y = ((ty * self.tileSize) - self.camera.y) * self.superScaling;
            bounds.width = self.tileSize * self.superScaling;
            bounds.height = self.tileSize * self.superScaling;
            bounds.left = bounds.x;
            bounds.right = bounds.x + bounds.width;
            bounds.top = bounds.y;
            bounds.bottom = bounds.y + bounds.height;

            return bounds;
        },

        getTileset: function() {
            return this.tileset;
        }

    });

});
