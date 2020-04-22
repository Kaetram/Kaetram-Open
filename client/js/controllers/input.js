/* global Modules, log, _, Detect, Packets */

define(['jquery', '../entity/animation', './chat', './overlay'], function($, Animation, Chat, Overlay) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;
            self.app = game.app;
            self.renderer = game.renderer;
            self.map = game.map;

            self.selectedCellVisible = false;
            self.previousClick = {};
            self.cursorVisible = true;
            self.targetVisible = true;
            self.selectedX = -1;
            self.selectedY = -1;

            self.cursor = null;
            self.newCursor = null;

            self.targetData = null;
            self.targetColour = null;
            self.newTargetColour = null;
            self.mobileTargetColour = 'rgba(51, 255, 0)';

            self.keyMovement = true;
            self.cursorMoved = false;

            self.previousKey = {};

            self.cursors = {};

            self.lastMousePosition = { x: 0, y: 0 };

            self.hovering = null;
            self.hoveringEntity = null; // for debugging

            self.mouse = {
                x: 0,
                y: 0
            };

            self.load();
        },

        load: function() {
            var self = this;

            /**
             * This is the animation for the target
             * cell spinner sprite (only on desktop)
             */

            self.targetAnimation = new Animation('move', 4, 0, 16, 16);
            self.targetAnimation.setSpeed(50);

            self.chatHandler = new Chat(self.game);
            self.overlay = new Overlay(self);
        },

        loadCursors: function() {
            var self = this;

            self.cursors['hand'] = self.game.getSprite('hand');
            self.cursors['sword'] = self.game.getSprite('sword');
            self.cursors['loot'] = self.game.getSprite('loot');
            self.cursors['target'] = self.game.getSprite('target');
            self.cursors['arrow'] = self.game.getSprite('arrow');
            self.cursors['talk'] = self.game.getSprite('talk');
            self.cursors['spell'] = self.game.getSprite('spell');
            self.cursors['bow'] = self.game.getSprite('bow');

            self.newCursor = self.cursors['hand'];
            self.newTargetColour = 'rgba(255, 255, 255, 0.5)';

            if (self.game.isDebug())
                log.info('Loaded Cursors!');
        },

        handle: function(inputType, data) {
            var self = this,
                player = self.getPlayer();

            switch(inputType) {
                case Modules.InputType.Key:

                    if (self.chatHandler.isActive()) {
                        self.chatHandler.key(data);
                        return;
                    }

                    switch(data) {

                        case Modules.Keys.W:
                        case Modules.Keys.Up:

                            player.moveUp = true;

                            break;

                        case Modules.Keys.A:
                        case Modules.Keys.Left:

                            player.moveLeft = true;

                            break;

                        case Modules.Keys.S:
                        case Modules.Keys.Down:

                            player.moveDown = true;

                            break;

                        case Modules.Keys.D:
                        case Modules.Keys.Right:

                            player.moveRight = true;

                            break;

                        case Modules.Keys.Spacebar:

                            if (player.moving)
                                break;

                            if (!player.isRanged())
                                break;

                            player.frozen = true;

                            self.updateFrozen(player.frozen);

                            break;

                        case Modules.Keys.Slash:

                            self.chatHandler.input.val('/');

                        case Modules.Keys.Enter:

                            self.chatHandler.toggle();

                            break;

                        case Modules.Keys.I:

                            self.game.interface.inventory.open();

                            break;

                        case Modules.Keys.M:

                            self.game.interface.warp.open();

                            break;

                        case Modules.Keys.P:

                            self.game.interface.profile.open();

                            break;

                        case Modules.Keys.Esc:

                            self.game.interface.profile.settings.open();

                            break;
                    }

                    break;

                case Modules.InputType.LeftClick:

                    player.disableAction = false;
                    self.keyMovement = false;
                    self.setCoords(data);

                    if (window.event.ctrlKey) {
                        log.info('Control key is pressed lmao');

                        self.game.socket.send(Packets.Command, [Packets.CommandOpcode.CtrlClick, self.getCoords()]);
                        return;
                    }

                    self.leftClick(self.getCoords());

                    break;

                case Modules.InputType.RightClick:

                    self.rightClick(self.getCoords());

                    break;
            }
        },

        keyUp: function(key) {
            var self = this,
                player = self.getPlayer();

            switch(key) {
                case Modules.Keys.W:
                case Modules.Keys.Up:

                    player.moveUp = false;

                    break;

                case Modules.Keys.A:
                case Modules.Keys.Left:

                    player.moveLeft = false;

                    break;

                case Modules.Keys.S:
                case Modules.Keys.Down:

                    player.moveDown = false;

                    break;

                case Modules.Keys.D:
                case Modules.Keys.Right:

                    player.moveRight = false;

                    break;

                case Modules.Keys.Spacebar:

                    if (player.moving)
                        break;

                    if (!player.isRanged())
                        break;

                    player.frozen = false;

                    self.updateFrozen(player.frozen);

                    break;
            }

            player.disableAction = false;
        },

        keyMove: function(position) {
            var self = this,
                player = self.getPlayer();

            if (!player.hasPath()) {
                self.keyMovement = true;
                self.cursorMoved = false;

                if (self.game.isDebug()) {
                    log.info('--- keyMove ---');
                    log.info(position);
                    log.info('---------------');
                }

                self.leftClick(position);
            }
        },

        leftClick: function(position) {
            var self = this,
                player = self.getPlayer();

            if (player.stunned)
                return;

            self.setPassiveTarget();

            /**
             * It can be really annoying having the chat open
             * on mobile, and it is far harder to control.
             */

            if (self.renderer.mobile && self.chatHandler.input.is(':visible') && self.chatHandler.input.val() === '')
                self.chatHandler.hideInput();

            if (self.map.isOutOfBounds(position.x, position.y))
                return;

            if ((self.game.zoning && self.game.zoning.direction) || player.disableAction)
                return;

            if (self.game.interface)
                self.game.interface.hideAll();

            if (self.map.isObject(position.x, position.y)) {

                player.setObjectTarget(position.x, position.y)
                player.followPosition(position.x, position.y);

                return;
            }

            if (self.renderer.mobile)
                self.entity = self.game.getEntityAt(position.x, position.y, (position.x === player.gridX && position.y === player.gridY));

            if (self.entity) {
                player.disableAction = true;

                self.setAttackTarget();

                if (self.isTargetable(self.entity))
                    player.setTarget(self.entity);

                if (player.getDistance(self.entity) < 7 && player.isRanged() && self.isAttackable(self.entity)) {
                    self.game.socket.send(Packets.Target, [Packets.TargetOpcode.Attack, self.entity.id]);
                    player.lookAt(self.entity);
                    return;
                }

                if (self.entity.gridX === player.gridX && self.entity.gridY === player.gridY)
                    self.game.socket.send(Packets.Target, [Packets.TargetOpcode.Attack, self.entity.id]);

                if (self.isTargetable(self.entity)) {
                    player.follow(self.entity);
                    return;
                }
            }

            player.go(position.x, position.y);

        },

        rightClick: function(position) {
            var self = this;

            if (self.renderer.mobile)
                self.entity = self.game.getEntityAt(position.x, position.y, self.isSamePosition(position));

            if (self.entity) {

                var actions = self.getActions();

                actions.loadDefaults(self.entity.type, {
                    mouseX: self.mouse.x,
                    mouseY: self.mouse.y,
                    pvp: self.entity.pvp
                });

                actions.show();

            } else if (self.hovering === Modules.Hovering.Object) {
                //TODO
            }

        },

        updateCursor: function() {
            var self = this;

            if (!self.cursorVisible)
                return;

            if (self.newCursor !== self.cursor)
                self.cursor = self.newCursor;

            if (self.newTargetColour !== self.targetColour)
                self.targetColour = self.newTargetColour;
        },

        moveCursor: function() {
            var self = this;

            if (!self.renderer || self.renderer.mobile || !self.renderer.camera)
                return;

            var position = self.getCoords(),
                player = self.getPlayer();

            // The entity we are currently hovering over.
            self.entity = self.game.getEntityAt(position.x, position.y, self.isSamePosition(position));

            self.overlay.update(self.entity);

            if (!self.entity || (self.entity.id === player.id)) {
                if (self.map.isObject(position.x, position.y)) {
                    self.setCursor(self.cursors['talk']);
                    self.hovering = Modules.Hovering.Object;
                } else {
                    self.setCursor(self.cursors['hand']);
                    self.hovering = null;
                }
            } else {
                switch (self.entity.type) {
                    case 'item':
                    case 'chest':
                        self.setCursor(self.cursors['loot']);
                        self.hovering = Modules.Hovering.Item;
                        break;

                    case 'mob':
                        self.setCursor(self.getAttackCursor());
                        self.hovering = Modules.Hovering.Mob;
                        break;

                    case 'npc':
                        self.setCursor(self.cursors['talk']);
                        self.hovering = Modules.Hovering.NPC;
                        break;

                    case 'player':
                        if (self.entity.pvp && self.game.pvp) {
                            self.setCursor(self.getAttackCursor());
                            self.hovering = Modules.Hovering.Player;
                        }

                        break;
                }
            }
        },

        setPosition: function(x, y) {
            var self = this;

            self.selectedX = x;
            self.selectedY = y;
        },

        setCoords: function(event) {
            var self = this,
                offset = self.app.canvas.offset(),
                width = self.renderer.background.width,
                height = self.renderer.background.height;

            self.cursorMoved = false;

            self.mouse.x = Math.round((event.pageX - offset.left));
            self.mouse.y = Math.round((event.pageY - offset.top));

            if (self.mouse.x >= width)
                self.mouse.x = width - 1;
            else if (self.mouse.x <= 0)
                self.mouse.x = 0;

            if (self.mouse.y >= height)
                self.mouse.y = height - 1;
            else if (self.mouse.y <= 0)
                self.mouse.y = 0;
        },

        setCursor: function(cursor) {
            var self = this;

            if (cursor)
                self.newCursor = cursor;
            else
                log.error('Cursor: ' + cursor + ' could not be found.');
        },

        setAttackTarget: function() {
            var self = this;

            self.targetAnimation.setRow(1);
            self.mobileTargetColour = 'rgb(255, 51, 0)';
        },

        setPassiveTarget: function() {
            var self = this;

            self.targetAnimation.setRow(0);
            self.mobileTargetColour = 'rgb(51, 255, 0)';
        },

        getAttackCursor: function() {
            return this.cursors[this.getPlayer().isRanged() ? 'bow' : 'sword'];
        },

        getCoords: function() {
            var self = this;

            if (!self.renderer || !self.renderer.camera)
                return;

            var tileScale = self.renderer.tileSize * self.renderer.getSuperScaling(),
                offsetX = self.mouse.x % tileScale,
                offsetY = self.mouse.y % tileScale,
                x = ((self.mouse.x - offsetX) / tileScale) + self.game.getCamera().gridX,
                y = ((self.mouse.y - offsetY) / tileScale) + self.game.getCamera().gridY;

            return {
                x: x,
                y: y
            };
        },

        getTargetData: function() {
            var self = this,
                frame = self.targetAnimation.currentFrame,
                superScale = self.renderer.getSuperScaling(),
                sprite = self.game.getSprite('target');

            if (!sprite.loaded)
                sprite.load();

            return self.targetData = {
                sprite: sprite,
                x: frame.x * superScale,
                y: frame.y * superScale,
                width: sprite.width * superScale,
                height: sprite.height * superScale,
                dx: self.selectedX * 16 * superScale,
                dy: self.selectedY * 16 * superScale,
                dw: sprite.width * superScale,
                dh: sprite.height * superScale
            };
        },

        updateFrozen: function(state) {
            this.game.socket.send(Packets.Movement, [Packets.MovementOpcode.Freeze, state]);
        },

        isTargetable: function(entity) {
            return this.isAttackable(entity) || entity.type === 'npc' || entity.type === 'chest';
        },

        isAttackable: function(entity) {
            return entity.type === 'mob' || (entity.type === 'player' && entity.pvp && this.game.pvp);
        },

        isSamePosition: function(position) {
            return position.x === this.game.player.gridX && position.y === this.game.player.gridY;
        },

        getPlayer: function() {
            return this.game.player;
        },

        getActions: function() {
            return this.game.interface.actions;
        }

    });

});
