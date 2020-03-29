/* global _, m4, log, Detect */

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

            self.context = self.entities.getContext('2d'); // Entities

            if (!Detect.supportsWebGL())
                self.backContext = self.background.getContext('2d'); // Background
            else
                self.backContext = self.background.getContext('webgl') || self.background.getContext('experimental-webgl');

            self.foreContext = self.foreground.getContext('2d'); // Foreground
            self.overlayContext = self.overlay.getContext('2d'); // Lighting
            self.textContext = self.textCanvas.getContext('2d'); // Texts
            self.cursorContext = self.cursor.getContext('2d'); // Cursor

            self.canvases = [self.background, self.entities, self.foreground, self.overlay, self.textCanvas, self.cursor];

            self.allContexts = [self.context, self.backContext, self.foreContext, self.overlayContext, self.textContext, self.cursorContext];

            self.contexts = [self.context, self.textContext, self.overlayContext];
            self.drawingContexts = [self.backContext, self.foreContext]; // For drawing the map.


            self.lightings = [];
            self.textures = {};

            self.game = game;
            self.camera = null;
            self.entities = null;
            self.input = null;

            self.tileSize = 16;
            self.fontSize = 16;

            self.screenWidth = 0;
            self.screenHeight = 0;

            self.time = new Date();

            self.fps = 0;
            self.frameCount = 0;
            self.renderedFrame = [0, 0];
            self.lastTarget = [0, 0];

            self.animatedTiles = {};
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
            self.animatedTilesDrawCalls = 0;

			self.tiles = {};
			self.cells = {};

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
            self.checkDevice();
        },

        removeSmoothing: function() {
            var self = this;

            self.forAllContexts(function(context) {
                if (!context)
                    return;

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

            self.canvasWidth = self.screenWidth * self.superScaling;
            self.canvasHeight = self.screenHeight * self.superScaling;

            self.forEachCanvas(function(canvas) {
                canvas.width = self.canvasWidth;
                canvas.height = self.canvasHeight;
            });

            if (self.webGL)
                self.map.loadWebGL(self.backContext);
        },

        loadCamera: function() {
            var self = this,
                storage = self.game.storage;

            self.camera = new Camera(self);

            self.loadSizes();

            if (!storage.data.new)
                return;

            if (self.mEdge || self.firefox || Detect.useCenteredCamera()) {

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

            self.clear();

            self.checkDevice();

            if (!self.resizeTimeout)
                self.resizeTimeout = setTimeout(function() {

                    self.scale = self.getScale();
                    self.clearScreen(self.cursorContext);

                    if (self.camera)
                        self.camera.update();

                    self.loadSizes();

                    self.game.sendClientData();

                    if (self.entities)
                        self.entities.update();

                    if (self.camera)
                        self.camera.centreOn(self.game.player);

                    if (self.game.interface)
                        self.game.interface.resize();

                    self.stopRendering = false;
                    self.resizeTimeout = null;

                    self.updateAnimatedTiles();

                    self.forceRendering = true;

                }, 500);
        },

        render: function() {
            var self = this;

            if (self.stopRendering)
                return;

            self.clear();
            self.save();

            self.removeSmoothing();

            /**
             * Rendering related draws
             */

            self.draw();

            self.drawAnimatedTiles();

            self.drawDebugging();

            self.drawOverlays();

            self.drawTargetCell();

            self.drawSelectedCell();

            self.drawEntities();

            self.drawInfos();

            self.drawCursor();

            self.calculateFPS();

            self.restore();

        },

        /**
         * Context Drawing
         */

        draw: function() {
            var self = this;

            if (self.webGL) { // Do the WebGL Rendering here
                self.drawWebGL();
                return;
            }

            // Canvas rendering.
            if (self.hasRenderedFrame())
                return;

            self.clearDrawing();
            self.saveDrawing();

            self.updateDrawingView();

            self.forEachVisibleTile(function(id, index) {
                var isHighTile = self.map.isHighTile(id),
                    context = isHighTile ? self.foreContext : self.backContext;

                // Only do the lighting logic if there is an overlay.
                if (self.game.overlays.getFog()) {
                    var isLightTile = self.map.isLightTile(id);

                    context = isLightTile ? self.overlayContext : context;
                }

                if (!self.map.isAnimatedTile(id) || !self.animateTiles)
                    self.drawTile(context, id, index);
            });

            self.restoreDrawing();

            self.saveFrame();

        },

        drawWebGL: function() {
            var self = this,
                dt = self.game.time - self.game.lastTime;

            self.game.lastTime = self.game.time;

            self.map.webGLMap.tileScale = 3;

            self.map.webGLMap.update(dt);
            self.map.webGLMap.draw(self.camera.x, self.camera.y);

            // This is a janky and temporary solution to drawing high tiles
            // on the WebGL context.

            self.foreContext.clearRect(0, 0, self.foreground.width, self.foreground.height);
            self.foreContext.save();

            self.setCameraView(self.foreContext);

            self.forEachVisibleTile(function(id, index) {
                if (self.map.isHighTile(id))
                    self.drawTile(self.foreContext, id, index);

            });

            self.foreContext.restore();
        },

        drawAnimatedTiles: function() {
            var self = this;

            if (!self.animateTiles || self.webGL)
                return;

            self.context.save();
            self.setCameraView(self.context);

            self.forEachAnimatedTile(function(tile) {
                if (!self.camera.isVisible(tile.x, tile.y, 3, 1))
                    return;

                tile.animate(self.game.time);

                self.drawTile(self.context, tile.id, tile.index);

            });

            self.context.restore();
        },

        drawOverlays: function() {
            var self = this,
                overlay = self.game.overlays.getFog();

            if (overlay) {

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

            }
        },

        drawInfos: function() {
            var self = this;

            if (self.game.info.getCount() === 0)
                return;

            self.game.info.forEachInfo(function(info) {
                self.textContext.save();
                self.setCameraView(self.textContext);
                self.textContext.globalAlpha = info.opacity;
                self.drawText('' + info.text, Math.floor((info.x + 8)), Math.floor(info.y), true, info.fill, info.stroke, 26);
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

            if (self.game.player.dead)
                return;

            self.setCameraView(self.context);

            self.forEachVisibleEntity(function(entity) {
                if (!entity) return;

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

            if (data.sprite !== sprite) {

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

            if (entity.customScale)
                self.context.scale(entity.customScale, entity.customScale);

            if (entity.angled)
                self.context.rotate(data.angle);

            if (entity.hasShadow()) {
                self.context.globalCompositeOperation = 'source-over';

                self.context.drawImage(self.shadowSprite.image, 0, 0, data.shadowWidth, data.shadowHeight,
                    0, data.shadowOffsetY, data.shadowWidth, data.shadowHeight);
            }

            self.drawEntityBack(entity);

            self.context.drawImage(sprite.image, x, y, data.width, data.height, data.ox, data.oy, data.width, data.height);

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

             if (entity instanceof Character && !entity.dead && !entity.teleporting) {
                 if (entity.hasWeapon()) {
                     var weapon = self.entities.getSprite(entity.weapon.getString());

                     if (weapon) {
                         if (!weapon.loaded)
                             weapon.load();

                         var animation = entity.currentAnimation,
                             weaponAnimationData = weapon.animationData[animation.name],
                             frame = entity.currentAnimation.currentFrame,
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

                 if (entity.hasEffect()) {
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

                         animation.update(self.game.time);

                     }
                 }

             }

            if (entity instanceof Item) {

                var sparksAnimation = self.entities.sprites.sparksAnimation,
                    sparksFrame = sparksAnimation.currentFrame,
                    sparksX = self.sparksSprite.width * sparksFrame.index * self.superScaling,
                    sparksY = self.sparksSprite.height * sparksAnimation.row * self.superScaling,
                    sparksWidth = self.sparksSprite.width * self.superScaling,
                    sparksHeight = self.sparksSprite.height * self.superScaling;

                self.context.drawImage(self.sparksSprite.image, sparksX, sparksY, sparksWidth, sparksHeight,
                    0, 0, sparksWidth, sparksHeight);
            }


        },

        drawHealth: function(entity) {
            var self = this;

            if (!entity.hitPoints || entity.hitPoints < 0 || !entity.healthBarVisible)
                return;

            var barLength = 16,
                healthX = entity.x * self.superScaling - barLength / 2 + 8,
                healthY = (entity.y - 6) * self.superScaling,
                healthWidth = Math.round(entity.hitPoints / entity.maxHitPoints * barLength * self.superScaling),
                healthHeight = 2 * self.superScaling;

            self.textContext.save();
            self.setCameraView(self.textContext);
            self.textContext.strokeStyle = '#00000';
            self.textContext.lineWidth = 1;
            self.textContext.strokeRect(healthX, healthY, barLength * self.superScaling, healthHeight);
            self.textContext.fillStyle = '#FD0000';
            self.textContext.fillRect(healthX, healthY, healthWidth, healthHeight);
            self.textContext.restore();
        },

        drawName: function(entity) {
            var self = this;

            if (entity.hidden || !entity.drawNames() || (!self.drawNames && !self.drawLevels))
                return;

            var colour = entity.wanted ? 'red' : 'white';

            if (entity.rights > 1)
                colour = '#ba1414';
            else if (entity.rights > 0)
                colour = '#a59a9a';

            if (entity.id === self.game.player.id)
                colour = '#fcda5c';

            if (entity.nameColour)
                colour = entity.nameColour;

            self.textContext.save();
            self.setCameraView(self.textContext);
            self.textContext.font = '11px AdvoCut';

            if (!entity.hasCounter) {
                var x = entity.x + 8;
                var y = entity.y - 10;

                if (self.drawNames && entity instanceof Character)
                    self.drawText(entity.name, x, (self.drawLevels && entity.type !== 'npc') ? y - 8 : y, true, colour, '#000');

                if (self.drawLevels && (entity.type === 'mob' || entity.type === 'player'))
                    self.drawText('Level ' + entity.level, x, y, true, colour, '#000');

                if (entity.type === 'item') {
                    if (entity.count > 1)
                        self.drawText(entity.count, x, y, true, colour);

                    if (entity.ability > -1)
                        self.drawText(Modules.EnchantmentNames[entity.ability] + ' [+' + entity.abilityLevel + ']', x, entity.y + 20, true, colour);
                }


            } else {

                //TODO - Move this countdown elsewhere.
                if (self.game.time - entity.countdownTime > 1000) {
                    entity.countdownTime = self.game.time;
                    entity.counter--;
                }

                if (entity.counter <= 0)
                    entity.hasCounter = false;

                self.drawText(entity.counter, (entity.x + 8), (entity.y - 10), true, colour);
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

            if (cursor) {
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
            this.drawText('FPS: ' + this.realFPS, 10, 31, false, 'white');
        },

        drawPosition: function() {
            var self = this,
                player = self.game.player;

            self.drawText('x: ' + player.gridX + ' y: ' + player.gridY + ' tileIndex: ' + self.map.gridPositionToIndex(player.gridX, player.gridY), 10, 51, false, 'white');

            if (self.input.hoveringEntity) {
                self.drawText('x: ' + self.input.getCoords().x + ' y: ' + self.input.getCoords().y + ' instance: ' + self.input.hoveringEntity.id, 10, 71, false, 'white');
                self.drawText('attack range: ' + self.input.hoveringEntity.attackRange, 10, 91, false, 'white');
            }

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

        drawTile: function(context, tileId, cellId) {
            var self = this,
				originalTileId = tileId, rotation;

			/**
			 * `originalTileId` is the tileId prior to doing any
			 * bitwise operations (for rotations).
			 */

            if (tileId < 0)
                return;

            if (tileId > DIAGONAL_FLIP_FLAG) {
                if (!(tileId & HORIZONTAL_FLIP_FLAG))
                    rotation = ROT_NEG_90_DEG;

                if (!(tileId & VERTICAL_FLIP_FLAG))
                    rotation = ROT_90_DEG;

                if (!(tileId & DIAGONAL_FLIP_FLAG))
                    rotation = ROT_180_DEG;

                tileId &= ~(HORIZONTAL_FLIP_FLAG | VERTICAL_FLIP_FLAG | DIAGONAL_FLIP_FLAG);
            }

            var tileset = self.map.getTilesetFromId(tileId);

            if (!tileset)
                return;

			/**
			 * Removed tilesetScale (tileset.scale) variables since it
			 * is generally always 1. The reason for the variable was
			 * due to the usage of the large PNG file, which Chrome
			 * split up and messed with.
			*/

			if (!(originalTileId in self.tiles)) {
				var setWidth = tileset.width / self.tileSize,
					relativeTileId = tileId - tileset.firstGID + 1;

				self.tiles[originalTileId] = {
					relativeTileId: relativeTileId,
					setWidth: setWidth,
					x: self.getX(relativeTileId + 1, setWidth) * self.tileSize,
					y: Math.floor(relativeTileId / setWidth) * self.tileSize,
					width: self.tileSize, height: self.tileSize,
					rotation: rotation
				};
			}

			if (!(cellId in self.cells)) {
				var scale = self.superScaling;

				self.cells[cellId] = {
					dx: self.getX(cellId + 1, self.map.width) * self.tileSize * scale,
					dy: Math.floor(cellId / self.map.width) * self.tileSize * scale,
					width: self.tileSize * scale, height: self.tileSize * scale
				};
			}

            self.drawImage(context,
				tileset,
				self.tiles[originalTileId],
				self.cells[cellId]);
        },

        drawImage: function(context, image, tile, cell) {
            var self = this,
                scale = self.superScaling, dx, dy; // self.superScaling * 1.5;

            if (!context)
                return;

            if (tile.rotation) {
                context.save();
                context.rotate(tile.rotation);

				dx = cell.dx;
				dy = cell.dy;

                var temp = cell.dx;

                switch (tile.rotation) {
                    case ROT_180_DEG:

                        context.translate(-cell.width, -cell.height);

                        dx = -dx, dy = -dy;

                        break;

                    case ROT_90_DEG:

                        context.translate(0, -cell.height);

                        dx = dy, dy = -temp;

                        break;

                    case ROT_NEG_90_DEG:

                        context.translate(-cell.width, 0);

                        dx = -dy, dy = temp;

                        break;
                }
            }

            context.drawImage(image,
                tile.x, // Source X
                tile.y, // Source Y
                tile.width, // Source Width
                tile.height, // Source Height
                tile.rotation ? dx : cell.dx, // Destination X
                tile.rotation ? dy : cell.dy, // Destination Y
                cell.width, // Destination Width
                cell.height); // Destination Height

            if (tile.rotation)
                context.restore();
        },

        drawText: function(text, x, y, centered, colour, strokeColour, fontSize) {
            var self = this,
                strokeSize = 3,
                context = self.textContext;

            if (text && x && y) {
                context.save();

                if (centered)
                    context.textAlign = 'center';

                context.strokeStyle = strokeColour || '#373737';
                context.lineWidth = strokeSize;
                context.font = (fontSize || self.fontSize) + 'px AdvoCut';
                context.strokeText(text, x * self.superScaling, y * self.superScaling);
                context.fillStyle = colour || 'white';
                context.fillText(text, x * self.superScaling, y * self.superScaling);

                context.restore()
            }
        },

        updateAnimatedTiles: function() {
            var self = this;

            if (!self.animateTiles || self.webGL)
                return;

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

                 if (!(index in self.animatedTiles)) {
                     var tile = new Tile(id, index, self.map),
                        position = self.map.indexToGridPosition(tile.index);

                    tile.setPosition(position);

                    self.animatedTiles[index] = tile;
                 }

            }, 2);

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
					for (var i in indexData)
						callback(indexData[i] - 1, index);
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

        getScale: function() {
            return this.game.getScaleFactor();
        },

        getSuperScaling: function() {
            return 3;
        },

        clear: function() {
            this.forEachContext(function(context) {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            });
        },

        clearText: function() {
            this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
            this.overlayContext.clearRect(0, 0, this.overlay.width, this.overlay.height);
        },

        clearDrawing: function() {
            this.forEachDrawingContext(function(context) {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            });
        },

        save: function() {
            this.forEachContext(function(context) {
                context.save();
            });
        },

        saveDrawing: function() {
            this.forEachDrawingContext(function(context) {
                context.save();
            });
        },

        restore: function() {
            this.forEachContext(function(context) {
                context.restore();
            });
        },

        restoreDrawing: function() {
            this.forEachDrawingContext(function(context) {
                context.restore();
            });
        },

        hasRenderedFrame: function() {
            var self = this;

            if (self.forceRendering || (self.mobile && self.camera.centered))
                return false;

            if (!self.camera || self.stopRendering || !self.input)
                return true;

            return self.renderedFrame[0] === self.camera.x && self.renderedFrame[1] === self.camera.y;
        },

        saveFrame: function() {
            var self = this;

            if (self.mobile && self.camera.centered)
                return;

            self.renderedFrame[0] = self.camera.x;
            self.renderedFrame[1] = self.camera.y;

            self.forceRendering = false;
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
            _.each(this.drawingContexts, function(context) {
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
            self.mEdge = Detect.isEdge();
            self.webGL = Detect.supportsWebGL();

            //self.animateTiles = !self.firefox && !self.mEdge;
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

        parseObjects: function(objects) {
            var self = this,
                parsedObjects = [];

            if (!objects)
                return parsedObjects;

            for (var i = 0; i < objects.length; i++) {
                let object = objects[i];

                parseObjects.push(new RectangleObject({
                    topleft: new Vec2(object.x, object.y),
                    bottomright: new Vec2(object.x + self.tileSize, object.y + self.tileSize)
                }));
            }

            return parsedObjects;
        },

        addLight: function(x, y, distance, diffuse, color, relative, objects) {
            var self = this,
                light = new Lamp(self.getLightData(x, y, distance, diffuse, color)),
                lighting = new Lighting({
                    light: light,
                    objects: self.parseObjects(objects),
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

var DarkMask = illuminated.DarkMask,
    Lamp = illuminated.Lamp,
    Lighting = illuminated.Lighting,
    Vec2 = illuminated.Vec2;

const HORIZONTAL_FLIP_FLAG = 0x80000000,
      VERTICAL_FLIP_FLAG = 0x40000000,
      DIAGONAL_FLIP_FLAG = 0x20000000,
      ROT_90_DEG = Math.PI / 2,
      ROT_NEG_90_DEG = ROT_90_DEG * -1,
      ROT_180_DEG = Math.PI;
