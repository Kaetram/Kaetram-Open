var Combat = require('../../js/game/entity/character/combat/combat'),
    Packets = require('../../js/network/packets'),
    Messages = require('../../js/network/messages'),
    Utils = require('../../js/util/utils'),
    _ = require('underscore');

module.exports = QueenAnt = Combat.extend({

    /**
     * This is where bosses start to get a bit more complex.
     * The queen ant will do an AoE attack after staggering for five seconds,
     * indicating to the players. If players are caught up in this, the terror
     * explosion sprite is drawn above them.
     */

    init: function(character) {
        var self = this;

        character.spawnDistance = 18;

        self._super(character);

        self.lastActionThreshold = 10000; //Due to the nature of the AoE attack

        self.character = character;

        self.aoeTimeout = null;

        self.aoeCountdown = 5;
        self.aoeRadius = 2;
        self.lastAoE = 0;

        self.minionCount = 7;
        self.lastSpawn = 0;
        self.minions = [];

        self.frozen = false;

        self.character.onDeath(function() {

            /**
             * This is to prevent the boss from dealing
             * any powerful AoE attack after dying.
             */

            self.lastSpawn = 0;

            if (self.aoeTimeout) {
                clearTimeout(self.aoeTimeout);
                self.aoeTimeout = null;
            }

            var listCopy = self.minions.slice();

            for (var i = 0; i < listCopy.length; i++)
                self.world.kill(listCopy[i]);

        });

        self.character.onReturn(function() {
            clearTimeout(self.aoeTimeout);
            self.aoeTimeout = null;
        });

    },

    begin: function(attacker) {
        var self = this;

        self.resetAoE();

        self._super(attacker);
    },

    hit: function(attacker, target, hitInfo) {
        var self = this;

        if (self.frozen)
            return;

        if (self.canCastAoE()) {
            self.doAoE();
            return;
        }

        if (self.canSpawn())
            self.spawnMinions();

        if (self.isAttacked())
            self.beginMinionAttack();

        self._super(attacker, target, hitInfo);
    },

    doAoE: function() {
        var self = this;

        /**
         * The reason this function does not use its superclass
         * representation is because of the setTimeout function
         * which does not allow us to call _super().
         */

        self.resetAoE();

        self.lastHit = self.getTime();

        self.pushFreeze(true);

        self.pushCountdown(self.aoeCountdown);

        self.aoeTimeout = setTimeout(function() {

            self.dealAoE(self.aoeRadius, true);

            self.pushFreeze(false);

        }, 5000);

    },

    spawnMinions: function() {
        var self = this;

        self.lastSpawn = new Date().getTime();

        for (var i = 0; i < self.minionCount; i++)
            self.minions.push(self.world.spawnMob(13, self.character.x, self.character.y));

        _.each(self.minions, function(minion) {

            minion.aggressive = true;
            minion.spawnDistance = 12;

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

    resetAoE: function() {
        this.lastAoE = new Date().getTime();
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

    pushFreeze: function(state) {
        var self = this;

        self.character.frozen = state;
        self.character.stunned = state;
    },

    pushCountdown: function(count) {
        var self = this;

        self.world.pushToAdjacentGroups(self.character.group, new Messages.NPC(Packets.NPCOpcode.Countdown, {
            id: self.character.instance,
            countdown: count
        }));
    },

    getMinions: function() {
        var self = this,
            grids = self.world.getGrids();


    },

    isLast: function() {
        return this.minions.length === 1;
    },

    hasMinions: function() {
        return this.minions.length > 0;
    },

    canCastAoE: function() {
        return new Date().getTime() - this.lastAoE > 30000;
    },

    canSpawn: function() {
        return new Date().getTime() - this.lastSpawn > 45000 && !this.hasMinions() && this.isAttacked();
    }

});
