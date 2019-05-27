/* global log, Modules */

define(['../entity/character/character'], function(Character) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;
            self.camera = game.getCamera();
            self.renderer = game.renderer;
            self.input = game.input;
            self.sprites = null;
        },

        update: function() {
            this.timeDifferential = (new Date() - this.lastUpdate) / 1000;

            this.animateTiles();
            this.updateEntities();
            this.input.updateCursor();
            this.updateKeyboard();
            this.updateAnimations();
            this.updateInfos();
            this.updateBubbles();

            this.lastUpdate = new Date();
        },

        animateTiles: function() {
            var self = this,
                time = self.game.time;

            self.renderer.forEachAnimatedTile(function(tile) {
                tile.animate(time);
            });
        },

        updateEntities: function() {
            var self = this;

            self.game.entities.forEachEntity(function(entity) {

                if (entity.spriteLoaded) {
                    self.updateFading(entity);

                    var animation = entity.currentAnimation;

                    if (animation)
                        animation.update(self.game.time);

                    if (entity instanceof Character) {


                        if (entity.critical && entity.criticalAnimation)
                            entity.criticalAnimation.update(self.game.time);

                        if (entity.terror && entity.terrorAnimation)
                            entity.terrorAnimation.update(self.game.time);

                        if (entity.stunned && entity.stunAnimation)
                            entity.stunAnimation.update(self.game.time);

                        if (entity.explosion && entity.explosionAnimation)
                            entity.explosionAnimation.update(self.game.time);

                        if (entity.movement && entity.movement.inProgress)
                            entity.movement.step(self.game.time);

                        if (entity.hasPath() && !entity.movement.inProgress) {
                            var tick = Math.round(266 / entity.movementSpeed);

                            switch (entity.orientation) {
                                case Modules.Orientation.Left:

                                    entity.movement.start(self.game.time,
                                        function(x) {
                                            entity.x = x;
                                            entity.moved();
                                        },
                                        function() {
                                            entity.x = entity.movement.endValue;
                                            entity.moved();
                                            entity.nextStep();
                                        },
                                        entity.x - tick,
                                        entity.x - 16,
                                        entity.movementSpeed);

                                    break;

                                case Modules.Orientation.Right:

                                    entity.movement.start(self.game.time,
                                        function(x) {
                                            entity.x = x;
                                            entity.moved();
                                        },
                                        function() {
                                            entity.x = entity.movement.endValue;
                                            entity.moved();
                                            entity.nextStep();
                                        },
                                        entity.x + tick,
                                        entity.x + 16,
                                        entity.movementSpeed);

                                    break;

                                case Modules.Orientation.Up:

                                    entity.movement.start(self.game.time,
                                        function(y) {
                                            entity.y = y;
                                            entity.moved();
                                        },
                                        function() {
                                            entity.y = entity.movement.endValue;
                                            entity.moved();
                                            entity.nextStep();
                                        },
                                        entity.y - tick,
                                        entity.y - 16,
                                        entity.movementSpeed);

                                    break;

                                case Modules.Orientation.Down:

                                    entity.movement.start(self.game.time,
                                        function(y) {
                                            entity.y = y;
                                            entity.moved();
                                        },
                                        function() {
                                            entity.y = entity.movement.endValue;
                                            entity.moved();
                                            entity.nextStep();
                                        },
                                        entity.y + tick,
                                        entity.y + 16,
                                        entity.movementSpeed);

                                    break;
                            }
                        }

                    } else if (entity.type === 'projectile') {
                        var mDistance = entity.speed * self.timeDifferential,
                            dx = entity.destX - entity.x,
                            dy = entity.destY - entity.y,
                            tDistance = Math.sqrt(dx * dx + dy * dy),
                            amount = mDistance / tDistance;

                        if (amount > 1)
                            amount = 1;

                        entity.x += dx * amount;
                        entity.y += dy * amount;

                        if (tDistance < 5)
                            entity.impact();

                    }
                }
            });

        },

        updateFading: function(entity) {
            var self = this;

            if (!entity || !entity.fading)
                return;

            var duration = 1000,
                time = self.game.time,
                dt = time - entity.fadingTime;

            if (dt > duration) {
                entity.isFading = false;
                entity.fadingAlpha = 1;
            } else
                entity.fadingAlpha = dt / duration;
        },

        updateKeyboard: function() {
            var self = this,
                player = self.game.player,
                position = {
                    x: player.gridX,
                    y: player.gridY
                };

            if (player.frozen)
                return;

            if (player.moveUp)
                position.y--;
            else if (player.moveDown)
                position.y++;
            else if (player.moveRight)
                position.x++;
            else if (player.moveLeft)
                position.x--;

            if (player.hasKeyboardMovement())
                self.input.keyMove(position);

        },

        updateAnimations: function() {
            var self = this,
                target = self.input.targetAnimation;

            if (target && self.input.selectedCellVisible && !self.renderer.mobile)
                target.update(self.game.time);

            if (!self.sprites)
                return;

            var sparks = self.sprites.sparksAnimation;

            if (sparks)
                sparks.update(self.game.time);
        },

        updateInfos: function() {
            if (this.game.info)
                this.game.info.update(this.game.time);
        },

        updateBubbles: function() {
            if (this.game.bubble)
                this.game.bubble.update(this.game.time);

            if (this.game.pointer)
                this.game.pointer.update();
        },

        setSprites: function(sprites) {
            this.sprites = sprites;
        }

    });

});