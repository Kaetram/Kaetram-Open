var Combat = require('../../js/game/entity/character/combat/combat'),
    Messages = require('../../js/network/messages'),
    Packets = require('../../js/network/packets'),
    Utils = require('../../js/util/utils');

module.exports = Tenebris = Combat.extend({

    init: function(character) {
        var self = this;

        self._super(character);

        character.spawnDistance = 24;

        self.illusions = [];
        self.firstIllusionKilled = false;

        self.lastIllusion = new Date().getTime();
        self.respawnDelay = 95000;

        character.onDeath(function() {

            if (self.isIllusion())
                if (!self.firstIllusionKilled)
                    self.spawnTenbris();
            else {

                self.removeIllusions();

                self.reset();

            }
        });

        if (!self.isIllusion())
            self.forceTalk('Who dares summon Tenebris!');

    },

    reset: function() {
        var self = this;

        self.illusions = [];
        self.firstIllusionKilled = false;

        setTimeout(function() {

            var offset = Utils.positionOffset(4);

            self.world.spawnMob(105, 48 + offset.x, 338 + offset.y);

        }, self.respawnDelay);

    },

    hit: function(attacker, target, hitInfo) {
        var self = this;

        if (self.isAttacked())
            self.beginIllusionAttack();

        if (self.canSpawn())
            self.spawnIllusions();

        self._super(attacker, target, hitInfo);
    },

    spawnTenbris: function() {
        var self = this;

        self.world.spawnMob(104, self.character.x, self.character.y);
    },

    spawnIllusions: function() {
        var self = this;

        self.illusions.push(self.world.spawnMob(105, self.character.x + 1, self.character.y + 1));
        self.illusions.push(self.world.spawnMob(105, self.character.x - 1, self.character.y + 1));

        _.each(self.illusions, function(illusion) {
            illusion.onDeath(function() {
                if (self.isLast())
                    self.lastIllusion = new Date().getTime();

                self.illusions.splice(self.illusions.indexOf(illusion), 1);
            });

            if (self.isAttacked())
                self.beginIllusionAttack();
        });

        self.character.setPosition(62, 343);
        self.world.pushToGroup(self.character.group, new Messages.Teleport(self.character.instance, self.character.x, self.character.y, true));
    },

    removeIllusions: function() {
        var self = this;

        self.lastIllusion = 0;

        var listCopy = self.illusions.slice();

        for (var i = 0; i < listCopy.length; i++)
            self.world.kill(listCopy[i]);
    },

    beginIllusionAttack: function() {
        var self = this;

        if (!self.hasIllusions())
            return;

        _.each(self.illusions, function(illusion) {
            var target = self.getRandomTarget();

            if (!illusion.hasTarget && target)
                illusion.combat.begin(target);

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

    forceTalk: function(instance, message) {
        var self = this;

        if (!self.world)
            return;

        self.world.pushToAdjacentGroups(self.character.target.group, new Messages.NPC(Packets.NPCOpcode.Talk, {
            id: instance,
            text: message,
            nonNPC: true
        }));

    },

    isLast: function() {
        return this.illusions.length === 1;
    },

    canSpawn: function() {
        return !this.isIllusion() && !this.hasIllusions && new Date().getTime() - this.lastIllusion === 45000 && Utils.randomInt(0, 4) === 2;
    },

    isIllusion: function() {
        return this.character.id === 105;
    },

    hasIllusions: function() {
        return this.illusions.length > 0;
    }

});
