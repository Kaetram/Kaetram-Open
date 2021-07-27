import Entity from '../entity';
import { EntityState } from '../entity';

interface ItemState extends EntityState {
    count: number;
    ability: number;
    abilityLevel: number;
}

export default class Item extends Entity {
    static: boolean;
    dropped: boolean;
    shard: boolean;

    count: number;
    ability: number;
    abilityLevel: number;
    tier: number;

    respawnTime: number;
    despawnDuration: number;
    blinkDelay: number;
    despawnDelay: number;

    blinkTimeout: NodeJS.Timeout;
    despawnTimeout: NodeJS.Timeout;

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

    getData(): number[] {
        return [this.id, this.count, this.ability, this.abilityLevel];
    }

    getState(): ItemState {
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
