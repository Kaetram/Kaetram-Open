import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';

export default class Item extends Entity {
    public dropped = false;

    public constructor(
        instance: string,
        public count: number = 1,
        public enchantments: Enchantments = {}
    ) {
        super(instance, Modules.EntityType.Item);
    }

    public override idle(): void {
        this.setAnimation('idle', 150);
    }

    public override hasShadow(): boolean {
        return true;
    }
}
