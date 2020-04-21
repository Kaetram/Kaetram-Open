/* global log, Packets, Modules */

define(function() {

    /**
     * This is a player handler, responsible for all the callbacks
     * without having to clutter up the entire game file.
     */

    return Class.extend({

        init: function(game, player) {
            var self = this;

            self.game = game;
            self.map = game.map;
            self.camera = game.getCamera();
            self.input = game.input;
            self.player = player;
            self.entities = game.entities;
            self.socket = game.socket;
            self.renderer = game.renderer;

            self.load();
        },

        load: function() {
            var self = this;

            self.player.onRequestPath(function(x, y) {
                if (self.player.dead || self.player.frozen)
                    return null;

                /**
                 * If the position is the same as the player's current position
                 * we will return nothing. Otherwise this will just create
                 * a colliding tile and will interfere with combat.
                 */

                var ignores = [], isObject = self.map.isObject(x, y);

                if (self.player.gridX === x && self.player.gridY === y)
                    return ignores;

                ignores = [self.player];

                if (!self.map.isColliding(x, y) && !isObject)
                    self.socket.send(Packets.Movement, [Packets.MovementOpcode.Request, x, y, self.player.gridX, self.player.gridY]);

                if (isObject)
                    ignores.push({ hasPath: function() { return false; }, gridX: x, gridY: y });

                return self.game.findPath(self.player, x, y, ignores);
            });

            self.player.onStartPathing(function(path) {
                var i = path.length - 1;

                self.player.moving = true;

                self.input.selectedX = path[i][0];
                self.input.selectedY = path[i][1];
                self.input.selectedCellVisible = true;

                if (self.game.isDebug())
                    log.info('Movement speed: ' + self.player.movementSpeed);

                self.socket.send(Packets.Movement, [
                        Packets.MovementOpcode.Started,
                        self.input.selectedX,
                        self.input.selectedY,
                        self.player.gridX,
                        self.player.gridY,
                        self.player.movementSpeed,
                        self.getTargetId()
                    ]);
            });

            self.player.onStopPathing(function(x, y) {
                self.entities.unregisterPosition(self.player);
                self.entities.registerPosition(self.player);

                self.input.selectedCellVisible = false;

                self.camera.clip();

                var id = null,
                    entity = self.game.getEntityAt(x, y, true);

                if (entity)
                    id = entity.id;

                if (self.game.isDebug())
                    log.info('Stopping pathing.');

                var hasTarget = self.player.hasTarget();

                self.socket.send(Packets.Movement, [Packets.MovementOpcode.Stop, x, y, id, hasTarget, self.player.orientation]);

                self.socket.send(Packets.Target, [self.getTargetType(), self.getTargetId()]);

                if (hasTarget) {
                    self.player.lookAt(self.player.target);

                    if (self.player.target.type === 'object')
                        self.player.removeTarget();
                }

                self.input.setPassiveTarget();

                self.game.storage.setOrientation(self.player.orientation);

                self.player.moving = false;

            });

            self.player.onBeforeStep(function() {
                self.entities.unregisterPosition(self.player);


            });

            self.player.onStep(function() {
                if (self.player.hasNextStep())
                    self.entities.registerDuality(self.player);

                if (!self.camera.centered || self.camera.lockX || self.camera.lockY)
                    self.checkBounds();

                self.socket.send(Packets.Movement, [Packets.MovementOpcode.Step, self.player.gridX, self.player.gridY]);

                if (!self.isAttackable())
                    return;

                if (self.player.isRanged()) {
                    if (self.player.getDistance(self.player.target) < 7)
                        self.player.stop(true);
                } else {
                    self.input.selectedX = self.player.target.gridX;
                    self.input.selectedY = self.player.target.gridY;
                }
            });

            self.player.onSecondStep(function() {
                self.renderer.updateAnimatedTiles();
            });

            self.player.onMove(function() {
                /**
                 * This is a callback representing the absolute exact position of the player.
                 */

                if (self.camera.centered)
                    self.camera.centreOn(self.player);

                if (self.player.hasTarget())
                    self.player.follow(self.player.target);

            });

            self.player.onUpdateArmour(function(armourName, power) {
                self.player.setSprite(self.game.getSprite(armourName));

                if (self.game.interface && self.game.interface.profile)
                    self.game.interface.profile.update();
            });

            self.player.onUpdateEquipment(function(type, power) {

                if (self.game.interface && self.game.interface.profile)
                    self.game.interface.profile.update();

            });

        },

        isAttackable: function() {
            var self = this,
                target = self.player.target;

            if (!target)
                return;

            return target.type === 'mob' || (target.type === 'player' && target.pvp);
        },

        checkBounds: function() {
            var self = this,
                x = self.player.gridX - self.camera.gridX,
                y = self.player.gridY - self.camera.gridY;

            if (x === 0)
                self.game.zoning.setLeft();
            else if (y === 0)
                self.game.zoning.setUp();
            else if (x === self.camera.gridWidth - 2)
                self.game.zoning.setRight();
            else if (y === self.camera.gridHeight - 2)
                self.game.zoning.setDown();

            if (self.game.zoning.direction !== null) {
                var direction = self.game.zoning.getDirection();

                self.camera.zone(direction);

                self.socket.send(Packets.Movement, [Packets.MovementOpcode.Zone, direction]);

                self.renderer.updateAnimatedTiles();

                self.game.zoning.reset();
            }

        },

        getTargetId: function() {
            return this.player.target ? this.player.target.id : null;
        },

        getTargetType: function() {
            var self = this,
                target = self.player.target;

            if (!target)
                return Packets.TargetOpcode.None;

            if (self.isAttackable())
                return Packets.TargetOpcode.Attack;

            if (target.type === 'npc' || target.type === 'chest')
                return Packets.TargetOpcode.Talk;

            if (target.type === 'object')
                return Packets.TargetOpcode.Object;

            return Packets.TargetOpcode.None;
        }

    });

});
