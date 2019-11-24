/* global module */

let _ = require('underscore'),
    Character = require('../character'),
    Mobs = require('../../../../util/mobs'),
    Utils = require('../../../../util/utils'),
    Items = require('../../../../util/items'),
    MobHandler = require('./mobhandler');

class Mob extends Character {

    constructor(id, instance, x, y, world) {
        super(id, 'mob', instance, x, y);

        let self = this;

        if (!Mobs.exists(id))
            return;

        self.world = world;

        self.data = Mobs.Ids[self.id];
        self.hitPoints = self.data.hitPoints;
        self.maxHitPoints = self.data.hitPoints;
        self.drops = self.data.drops;

        self.respawnDelay = self.data.spawnDelay;

        self.level = self.data.level;

        self.armourLevel = self.data.armour;
        self.weaponLevel = self.data.weapon;
        self.attackRange = self.data.attackRange;
        self.aggroRange = self.data.aggroRange;
        self.aggressive = self.data.aggressive;
        self.attackRate = self.data.attackRate;

        self.spawnLocation = [x, y];

        self.dead = false;
        self.boss = false;
        self.static = false;
        self.hiddenName = false;

        self.roaming = false;
        self.maxRoamingDistance = 3;

        self.projectileName = self.getProjectileName();

    }

    load() {
        let self = this;

        self.handler = new MobHandler(self, self.world);
    }

    refresh() {
        let self = this;

        self.hitPoints = self.data.hitPoints;
        self.maxHitPoints = self.data.hitPoints;

        if (self.refreshCallback)
            self.refreshCallback();

    }

    getDrop() {
        let self = this;

        if (!self.drops)
            return null;

        let min = 0,
            percent = 0,
            random = Utils.randomInt(0, 1000);

        for (let drop in self.drops)
            if (self.drops.hasOwnProperty(drop)) {
                let chance = self.drops[drop];

                min = percent;
                percent += chance;

                if (random >= min && random < percent) {
                    let count = 1;

                    if (drop === 'gold')
                        count = Utils.randomInt(1, self.level * 5);

                    return {
                        id: Items.stringToId(drop),
                        count: count
                    }
                }
            }

        return null;
    }

    getProjectileName() {
        return this.data.projectileName ? this.data.projectileName : 'projectile-pinearrow';
    }

    canAggro(player) {
        let self = this;

        if (self.hasTarget())
          return false;

        if (!self.aggressive)
          return false;

        if (Math.floor(self.level * 1.5) < player.level)
          return false;

        if (!player.hasAggressionTimer())
          return false;

        return self.isNear(player, self.aggroRange);
    }

    destroy() {
        let self = this;

        self.dead = true;
        self.clearTarget();
        self.resetPosition();
        self.respawn();

        if (self.area)
            self.area.removeEntity(self);
    }

    return() {
        let self = this;

        self.clearTarget();
        self.resetPosition();
        self.setPosition(self.x, self.y);
    }

    isRanged() {
        return this.attackRange > 1;
    }

    distanceToSpawn() {
        return this.getCoordDistance(this.spawnLocation[0], this.spawnLocation[1]);
    }

    isAtSpawn() {
        return this.x === this.spawnLocation[0] && this.y === this.spawnLocation[1];
    }

    isOutsideSpawn() {
        return this.distanceToSpawn() > this.spawnDistance;
    }

    addToChestArea(chestAreas) {
        let self = this,
            area = _.find(chestAreas, (area) => { return area.contains(self.x, self.y); });

        if (area)
            area.addEntity(self);
    }

    respawn() {
        let self = this;

        /**
         * Some entities are static (only spawned once during an event)
         * Meanwhile, other entities act as an illusion to another entity,
         * so the resawning script is handled elsewhere.
         */

        if (!self.static || self.respawnDelay === -1)
            return;

        setTimeout(() => {
            if (self.respawnCallback)
                self.respawnCallback();

        }, self.respawnDelay);
    }

    getState() {
        let self = this,
            base = super.getState();

        base.hitPoints = self.hitPoints;
        base.maxHitPoints = self.maxHitPoints;
        base.attackRange = self.attackRange;
        base.level = self.level;
        base.hiddenName = self.hiddenName;

        return base;
    }

    resetPosition() {
        let self = this;

        self.setPosition(self.spawnLocation[0], self.spawnLocation[1]);
    }

    onRespawn(callback) {
        this.respawnCallback = callback;
    }

    onReturn(callback) {
        this.returnCallback = callback;
    }

    onRefresh(callback) {
        this.refreshCallback = callback;
    }

    onDeath(callback) {
        this.deathCallback = callback;
    }

}

module.exports = Mob;
