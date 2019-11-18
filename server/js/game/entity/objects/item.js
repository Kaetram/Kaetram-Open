/* global module */

const Entity = require('../entity');

class Item extends Entity {
    constructor(id, instance, x, y) {
        super(id, 'item', instance, x, y);

        const self = this;

        self.static = false;
        self.dropped = false;
        self.shard = false;

        self.count = 1;
        self.ability = 0;
        self.abilityLevel = 0;
        self.tier = 1;

        self.respawnTime = 30000;
        self.despawnDuration = 4000;
        self.blinkDelay = 20000;
        self.despawnDelay = 1000;

        self.blinkTimeout = null;
        self.despawnTimeout = null;
    }

    destroy() {
        const self = this;

        if (self.blinkTimeout)
            clearTimeout(self.blinkTimeout);

        if (self.despawnTimeout)
            clearTimeout(self.despawnTimeout);

        if (self.static)
            self.respawn();
    }

    despawn() {
        const self = this;

        self.blinkTimeout = setTimeout(() => {
            if (self.blinkCallback)
                self.blinkCallback();

            self.despawnTimeout = setTimeout(() => {
                if (self.despawnCallback)
                    self.despawnCallback();
            }, self.despawnDuration);
        }, self.blinkDelay);
    }

    respawn() {
        const self = this;

        setTimeout(() => {
            if (self.respawnCallback)
                self.respawnCallback();
        }, self.respawnTime);
    }

    getData() {
        return [this.id, this.count, this.ability, this.abilityLevel];
    }

    getState() {
        const self = this,
            state = super.getState();

        state.count = self.count;
        state.ability = self.ability;
        state.abilityLevel = self.abilityLevel;

        return state;
    }

    setCount(count) {
        this.count = count;
    }

    setAbility(ability) {
        this.ability = ability;
    }

    setAbilityLevel(abilityLevel) {
        this.abilityLevel = abilityLevel;
    }

    onRespawn(callback) {
        this.respawnCallback = callback;
    }

    onBlink(callback) {
        this.blinkCallback = callback;
    }

    onDespawn(callback) {
        this.despawnCallback = callback;
    }
}

module.exports = Item;
