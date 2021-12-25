import Entity, { EntityData } from '../entity';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';
import Items from '@kaetram/server/src/info/items';

export default class Item extends Entity {
    public dropped = false;
    // shard = false;

    public count = 1;
    public ability = -1;
    public abilityLevel = -1;
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
        key: string,
        x: number,
        y: number,
        ability = -1,
        abilityLevel = -1,
        public respawnable = false
    ) {
        super(Utils.createInstance(Modules.EntityType.Item), key, x, y);

        this.ability = ability;
        this.abilityLevel = abilityLevel;

        if (isNaN(ability!)) this.ability = -1;

        if (isNaN(abilityLevel!)) this.abilityLevel = -1;
    }

    public destroy(): void {
        if (this.blinkTimeout) clearTimeout(this.blinkTimeout);

        if (this.despawnTimeout) clearTimeout(this.despawnTimeout);

        if (this.respawnable) this.respawn();
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

    public override serialize(): EntityData {
        let data = super.serialize();

        data.count = this.count;
        data.ability = this.ability;
        data.abilityLevel = this.abilityLevel;

        return data;
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
