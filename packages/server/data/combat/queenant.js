let Combat = require('../../js/game/entity/character/combat/combat'),
    Packets = require('../../js/network/packets'),
    Messages = require('../../js/network/messages'),
    Utils = require('../../js/util/utils'),
    _ = require('underscore');

class QueenAnt extends Combat {

    /*
     * The queen ant is a little more complex as it uses
     * AoE attacks and has a stun timer.
     */

    constructor(character) {
        character.spawnDistance = 18;
        super(character);

        let self = this;

        self.character = character;

        self.lastActionThreshold = 10000; //AoE Attack Threshold.

        self.aoeTimeout = null;

        self.aoeCountdown = 5;
        self.aoeRadius = 2;
        self.lastAoE = 0;

        self.minionCount = 7;
        self.lastSpawn = 0;
        self.minions = [];

        self.frozen = false;

        self.character.onDeath(() => {

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

        self.character.onReturn(() => {
            clearTimeout(self.aoeTimeout);
            self.aoeTimeout = null;
        });
    }

    begin(attacker) {
        var self = this;

        self.resetAoE();

        super.begin(attacker);
    }

    hit(attacker, target, hitInfo) {
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

        super.hit(attacker, target, hitInfo);
    }

    doAoE() {
        var self = this;

        /**
         * The reason this function does not use its superclass
         * representation is because of the setTimeout function
         * which does not allow us to call super().
         */

        self.resetAoE();

        self.lastHit = self.getTime();

        self.pushFreeze(true);

        self.pushCountdown(self.aoeCountdown);

        self.aoeTimeout = setTimeout(() => {

            self.dealAoE(self.aoeRadius, true);

            self.pushFreeze(false);

        }, 5000);

    }

    spawnMinions() {
        var self = this;

        self.lastSpawn = new Date().getTime();

        for (var i = 0; i < self.minionCount; i++)
            self.minions.push(self.world.spawnMob(13, self.character.x, self.character.y));

        _.each(self.minions, (minion) => {

            minion.aggressive = true;
            minion.spawnDistance = 12;

            minion.onDeath(() => {

                if (self.isLast())
                    self.lastSpawn = new Date().getTime();

                self.minions.splice(self.minions.indexOf(minion), 1);

            });

            if (self.isAttacked())
                self.beginMinionAttack();

        });
    }

    beginMinionAttack() {
        var self = this;

        if (!self.hasMinions())
            return;

        _.each(self.minions, (minion) => {

            var randomTarget = self.getRandomTarget();

            if (!minion.hasTarget() && randomTarget)
                minion.combat.begin(randomTarget);

        });
    }

    resetAoE() {
        this.lastAoE = new Date().getTime();
    }

    getRandomTarget() {
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
    }

    pushFreeze(state) {
        var self = this;

        self.character.frozen = state;
        self.character.stunned = state;
    }

    pushCountdown(count) {
        var self = this;

        self.world.push(Packets.PushOpcode.Regions, {
            regionId: self.character.region,
            message: new Messages.NPC(Packets.NPCOpcode.Countdown, {
                id: self.character.instance,
                countdown: count
            })
        });

    }

    getMinions() {
        var self = this,
            grids = self.world.getGrids();


    }

    isLast() {
        return this.minions.length === 1;
    }

    hasMinions() {
        return this.minions.length > 0;
    }

    canCastAoE() {
        return new Date().getTime() - this.lastAoE > 30000;
    }

    canSpawn() {
        return new Date().getTime() - this.lastSpawn > 45000 && !this.hasMinions() && this.isAttacked();
    }

}

module.exports = QueenAnt;
