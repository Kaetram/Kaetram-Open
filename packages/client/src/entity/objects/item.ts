import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';

export default class Item extends Entity {
    public dropped = false;
    public originalY = -1;

    public constructor(
        instance: string,
        public count: number = 1,
        public enchantments: Enchantments = {}
    ) {
        super(instance, Modules.EntityType.Item);
    }

    /**
     * Override for the `setAnimation` function to handle
     * bopping up and down when an item is spawned on the ground.
     */

    public override setAnimation(
        name: string,
        speed?: number,
        count?: number,
        onEndCount?: (() => void) | undefined
    ): void {
        super.setAnimation(name, speed, count, onEndCount);

        if (this.animation!.length > 1) return;

        // Store the original Y offset.
        this.originalY = this.sprite.offsetY;

        // We use the `onBop` callback to update the sprite's offset.
        this.animation?.onBop((bopIndex: number) => {
            this.offsetY = this.originalY - bopIndex;
        });
    }

    public override idle(): void {
        this.setAnimation('idle', 150);
    }

    public override hasShadow(): boolean {
        return true;
    }
}
