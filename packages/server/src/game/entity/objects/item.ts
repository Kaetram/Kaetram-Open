import Entity from '../entity';

import type { EntityState } from '../entity';

interface ItemState extends EntityState {
    count: number;
    ability?: number;
    abilityLevel?: number;
}

export default class Item extends Entity {
    static = false;
    dropped = false;
    shard = false;

    count = 1;
    ability;
    abilityLevel;
    tier = 1;

    respawnTime = 30000;
    despawnDuration = 4000;
    blinkDelay = 20000;
    despawnDelay = 1000;

    blinkTimeout: NodeJS.Timeout | null = null;
    despawnTimeout: NodeJS.Timeout | null = null;

    blinkCallback?(): void;
    respawnCallback?(): void;
    despawnCallback?(): void;

    constructor(
        id: number,
        instance: string,
        x: number,
        y: number,
        ability?: number,
        abilityLevel?: number
    ) {
        super(id, 'item', instance, x, y);

        this.ability = ability;
        this.abilityLevel = abilityLevel;

        if (isNaN(ability!)) this.ability = -1;

        if (isNaN(abilityLevel!)) this.abilityLevel = -1;
    }

    destroy(): void {
        if (this.blinkTimeout) clearTimeout(this.blinkTimeout);

        if (this.despawnTimeout) clearTimeout(this.despawnTimeout);

        if (this.static) this.respawn();
    }

    despawn(): void {
        this.blinkTimeout = setTimeout(() => {
            if (this.blinkCallback) this.blinkCallback();

            this.despawnTimeout = setTimeout(() => {
                if (this.despawnCallback) this.despawnCallback();
            }, this.despawnDuration);
        }, this.blinkDelay);
    }

    respawn(): void {
        setTimeout(() => {
            if (this.respawnCallback) this.respawnCallback();
        }, this.respawnTime);
    }

    getData(): [id: number, count: number, ability?: number, abilityLevel?: number] {
        return [this.id, this.count, this.ability, this.abilityLevel];
    }

    override getState(): ItemState {
        let state = super.getState() as ItemState;

        state.count = this.count;
        state.ability = this.ability;
        state.abilityLevel = this.abilityLevel;

        return state;
    }

    setCount(count: number): void {
        this.count = count;
    }

    setAbility(ability: number): void {
        this.ability = ability;
    }

    setAbilityLevel(abilityLevel: number): void {
        this.abilityLevel = abilityLevel;
    }

    onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }

    onBlink(callback: () => void): void {
        this.blinkCallback = callback;
    }

    onDespawn(callback: () => void): void {
        this.despawnCallback = callback;
    }
}
