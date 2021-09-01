import Entity from '../entity';

import type { EntityState } from '../entity';

interface ItemState extends EntityState {
    count: number;
    ability: number | undefined;
    abilityLevel: number | undefined;
}

export default class Item extends Entity {
    public static = false;
    public dropped = false;
    // shard = false;

    public count = 1;
    public ability;
    public abilityLevel;
    // tier = 1;

    private respawnTime = 30_000;
    private despawnDuration = 4000;
    private blinkDelay = 20_000;
    // private despawnDelay = 1000;

    private blinkTimeout: NodeJS.Timeout | null = null;
    private despawnTimeout: NodeJS.Timeout | null = null;

    private blinkCallback?(): void;
    private respawnCallback?(): void;
    private despawnCallback?(): void;

    public constructor(
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

    public destroy(): void {
        if (this.blinkTimeout) clearTimeout(this.blinkTimeout);

        if (this.despawnTimeout) clearTimeout(this.despawnTimeout);

        if (this.static) this.respawn();
    }

    public despawn(): void {
        this.blinkTimeout = setTimeout(() => {
            this.blinkCallback?.();

            this.despawnTimeout = setTimeout(() => {
                this.despawnCallback?.();
            }, this.despawnDuration);
        }, this.blinkDelay);
    }

    public respawn(): void {
        setTimeout(() => {
            this.respawnCallback?.();
        }, this.respawnTime);
    }

    private getData(): [
        id: number,
        count: number,
        ability: number | undefined,
        abilityLevel: number | undefined
    ] {
        return [this.id, this.count, this.ability, this.abilityLevel];
    }

    public override getState(): ItemState {
        let state = super.getState() as ItemState;

        state.count = this.count;
        state.ability = this.ability;
        state.abilityLevel = this.abilityLevel;

        return state;
    }

    private setCount(count: number): void {
        this.count = count;
    }

    private setAbility(ability: number): void {
        this.ability = ability;
    }

    private setAbilityLevel(abilityLevel: number): void {
        this.abilityLevel = abilityLevel;
    }

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }

    public onBlink(callback: () => void): void {
        this.blinkCallback = callback;
    }

    public onDespawn(callback: () => void): void {
        this.despawnCallback = callback;
    }
}
