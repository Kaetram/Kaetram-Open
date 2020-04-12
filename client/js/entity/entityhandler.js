/* global log, Packets */

define(['./character/character'], function(Character) {

    return Class.extend({

        init: function(entity) {
            var self = this;

            self.entity = entity;
            self.game = null;
            self.entities = null;
        },

        load: function() {
            var self = this;

            if (!self.entity || !self.game)
                return;

            if (self.isCharacter()) {

                self.entity.onRequestPath(function(x, y) {
                    var ignores = [];

                    if (self.entity.gridX === x && self.entity.gridY === y)
                        return ignores;

                    ignores = [self.entity];

                    return self.game.findPath(self.entity, x, y, ignores)
                });

                self.entity.onBeforeStep(function() {
                    self.entities.unregisterPosition(self.entity);
                });

                self.entity.onStep(function() {
                    self.entities.registerDuality(self.entity);

                    self.entity.forEachAttacker(function(attacker) {

                        /**
                         * This is the client-sided logic for representing PVP
                         * fights. It basically adds another layer of movement
                         * so the entity is always following the player.
                         */

                        if (self.entity.type !== 'player')
                            return;

                        if (attacker.type !== 'player')
                            return;

                        if (!attacker.hasTarget())
                            return;

                        if (attacker.target.id !== self.entity.id)
                            return;

                        if (attacker.stunned)
                            return;

                        attacker.follow(self.entity);
                    });

                    if (self.entity.type === 'mob')
                        self.game.socket.send(Packets.Movement, [Packets.MovementOpcode.Entity, self.entity.id, self.entity.gridX, self.entity.gridY]);

                    if (self.entity.attackRange > 1 && self.entity.hasTarget() && self.entity.getDistance(self.entity.target) <= self.entity.attackRange)
                        self.entity.stop(false);

                });

                self.entity.onStopPathing(function() {
                    self.entities.grids.addToRenderingGrid(self.entity, self.entity.gridX, self.entity.gridY);

                    self.entities.unregisterPosition(self.entity);
                    self.entities.registerPosition(self.entity);

                });
            }
        },

        isCharacter: function() {
            return this.entity.type && (this.entity.type === 'player' || this.entity.type === 'mob' || this.entity.type === 'npc');
        },

        setGame: function(game) {
            var self = this;

            if (!self.game)
                self.game = game;

            self.setEntities(self.game.entities);
        },

        setEntities: function(entities) {
            var self = this;

            if (!self.entities)
                self.entities = entities;
        }

    });

});
