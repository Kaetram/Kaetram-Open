/* global _, Modules */

define(['../utils/queue', '../renderer/infos/splat'], function(Queue, Splat) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;

            self.infos = {};
            self.destroyQueue = new Queue();
        },

        create: function(type, data, x, y) {
            var self = this;

            switch (type) {
                case Modules.Hits.Damage:
                case Modules.Hits.Stun:
                case Modules.Hits.Critical:
                    var damage = data.shift(),
                        isTarget = data.shift(),
                        dId = self.generateId(self.game.time, damage, x, y);

                    if (damage < 1 || !isInt(damage))
                        damage = 'MISS';

                    var hitSplat = new Splat(dId, type, damage, x, y, false),
                        dColour = isTarget ? Modules.DamageColours.received : Modules.DamageColours.inflicted;

                    hitSplat.setColours(dColour.fill, dColour.stroke);

                    self.addInfo(hitSplat);

                    break;

                case Modules.Hits.Heal:
                case Modules.Hits.Mana:
                case Modules.Hits.Experience:
                        var amount = data.shift(),
                            id = self.generateId(self.game.time, amount, x, y),
                            text = '+', colour;

                        if (amount < 1 || !isInt(amount))
                            return;

                        if (type !== Modules.Hits.Experience)
                            text = '++';

                        var splat = new Splat(id, type, text + amount, x, y, false);

                        if (type === Modules.Hits.Heal)
                            colour = Modules.DamageColours.healed;
                        else if (type === Modules.Hits.Mana)
                            colour = Modules.DamageColours.mana;
                        else if (type === Modules.Hits.Experience)
                            colour = Modules.DamageColours.exp;

                        splat.setColours(colour.fill, colour.stroke);

                        self.addInfo(splat);

                    break;

                case Modules.Hits.LevelUp:
                    var lId = self.generateId(self.game.time, '-1', x, y),
                        levelSplat = new Splat(lId, type, 'Level Up!', x, y, false),
                        lColour = Modules.DamageColours.exp;

                    levelSplat.setColours(lColour.fill, lColour.stroke);

                    self.addInfo(levelSplat);

                    break;

            }
        },

        getCount: function() {
            return Object.keys(this.infos).length;
        },

        addInfo: function(info) {
            var self = this;

            self.infos[info.id] = info;

            info.onDestroy(function(id) {
                self.destroyQueue.add(id);
            });
        },

        update: function(time) {
            var self = this;

            self.forEachInfo(function(info) {
                info.update(time);
            });

            self.destroyQueue.forEachQueue(function(id) {
                delete self.infos[id];
            });

            self.destroyQueue.reset();
        },

        forEachInfo: function(callback) {
            _.each(this.infos, function(info) {
                callback(info);
            });
        },

        generateId: function(time, info, x, y) {
            return time + '' + Math.abs(info) + '' + x + '' + y;
        }

    });

});