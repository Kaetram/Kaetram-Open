/** @format */

import Entity from '../entity';

class Item extends Entity {
    public id: any;
    public count: any;
    public ability: any;
    public abilityLevel: any;
    public respawnCallback: any;
    public blinkCallback: any;
    public despawnCallback: any;
    public blinkTimeout: any;
    public despawnTimeout: any;
    public static: any;
    public despawnDuration: any;
    public blinkDelay: any;
    public respawnTime: any;
    dropped: boolean;
    region: any;
    shard: boolean;
    tier: number;
    despawnDelay: number;

    constructor(id, instance, x, y, ability, abilityLevel) {
        super(id, 'item', instance, x, y);

        this.static = false;
        this.dropped = false;
        this.shard = false;

        this.count = 1;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.tier = 1;

        if (isNaN(ability)) this.ability = -1;

        if (isNaN(abilityLevel)) this.abilityLevel = -1;

        this.respawnTime = 30000;
        this.despawnDuration = 4000;
        this.blinkDelay = 20000;
        this.despawnDelay = 1000;

        this.blinkTimeout = null;
        this.despawnTimeout = null;
    }

    destroy() {
        if (this.blinkTimeout) clearTimeout(this.blinkTimeout);

        if (this.despawnTimeout) clearTimeout(this.despawnTimeout);

        if (this.static) this.respawn();
    }

    despawn() {
        this.blinkTimeout = setTimeout(() => {
            if (this.blinkCallback) this.blinkCallback();

            this.despawnTimeout = setTimeout(() => {
                if (this.despawnCallback) this.despawnCallback();
            }, this.despawnDuration);
        }, this.blinkDelay);
    }

    respawn() {
        setTimeout(() => {
            if (this.respawnCallback) this.respawnCallback();
        }, this.respawnTime);
    }

    getData() {
        return [this.id, this.count, this.ability, this.abilityLevel];
    }

    getState() {
        const state = super.getState();

        state.count = this.count;
        state.ability = this.ability;
        state.abilityLevel = this.abilityLevel;

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

export default Item;
