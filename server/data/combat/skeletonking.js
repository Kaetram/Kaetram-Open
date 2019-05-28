var Combat = require('../../js/game/entity/character/combat/combat'),
    Utils = require('../../js/util/utils'),
    _ = require('underscore');

module.exports = SkeletonKing = Combat.extend({

    /**
     * First of its kind, the Skeleton King will spawn 4 minions.
     * Two sorcerers on (x + 1, y + 1) & (x - 1, y + 1)
     *
     * And two death knights on (x + 1, y - 1) & (x - 1, y - 1)
     */

    init: function(character) {
        var self = this;

        self._super(character);

        character.spawnDistance = 10;

        self.lastSpawn = 0;

        self.minions = [];

        character.onDeath(function() {
            self.reset();
        });

    },

    reset: function() {
        var self = this;

        self.lastSpawn = 0;

        var listCopy = self.minions.slice();

        for (var i = 0; i < listCopy.length; i++)
            self.world.kill(listCopy[i]);
    },

    hit: function(character, target, hitInfo) {
        var self = this;

        if (self.isAttacked())
            self.beginMinionAttack();

        if (self.canSpawn())
            self.spawnMinions();

        self._super(character, target, hitInfo);
    },

    spawnMinions: function() {
        var self = this,
            x = self.character.x,
            y = self.character.y;

        self.lastSpawn = new Date().getTime();

        if (!self.colliding(x + 2, y - 2))
            self.minions.push(self.world.spawnMob(17, x + 2, y + 2));

        if (!self.colliding(x - 2, y - 2))
            self.minions.push(self.world.spawnMob(17, x - 2, y + 2));

        if (!self.colliding(x + 1, y + 1))
            self.minions.push(self.world.spawnMob(11, x + 1, y - 1));

        if (!self.colliding(x - 1, y + 1))
            self.minions.push(self.world.spawnMob(11, x - 1, y - 1));

        _.each(self.minions, function(minion) {
            minion.onDeath(function() {
                if (self.isLast())
                    self.lastSpawn = new Date().getTime();

                self.minions.splice(self.minions.indexOf(minion), 1);
            });

            if (self.isAttacked())
                self.beginMinionAttack();
        });
    },

    beginMinionAttack: function() {
        var self = this;

        if (!self.hasMinions())
            return;

        _.each(self.minions, function(minion) {
            var randomTarget = self.getRandomTarget();

            if (!minion.hasTarget() && randomTarget)
                minion.combat.begin(randomTarget);

        });
    },

    getRandomTarget: function() {
        var self = this;

        if (self.isAttacked()) {
            var keys = Object.keys(self.attackers),
                randomAttacker = self.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker)
                return randomAttacker;
        }

        if (self.character.hasTarget())
            return self.character.target;

        return null;
    },

    hasMinions: function() {
        return this.minions.length > 0;
    },

    isLast: function() {
        return this.minions.length === 1;
    },

    canSpawn: function() {
        return (new Date().getTime() - this.lastSpawn > 25000) && !this.hasMinions() && this.isAttacked();
    }

});
