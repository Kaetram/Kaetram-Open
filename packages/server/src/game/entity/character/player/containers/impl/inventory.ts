import { Modules } from '@kaetram/common/network';

import Container from '../container';

import type Item from '../../../../objects/item';
import type { SlotData } from '@kaetram/common/types/slot';

export default class Inventory extends Container {
    public constructor(size: number) {
        super(Modules.ContainerType.Inventory, size);
    }

    public override add(item: Item): boolean {
        if (!super.add(item)) {
            this.notifyCallback?.('There is not enough room in your inventory!');
            return false;
        }

        item.despawn(true);

        return true;
    }

    /**
     * Override for the container remove function with added functionality for prevention
     * of special items being dropped (generally applies to quest-related items).
     */

    public override remove(index: number, count = 1, drop = false): SlotData | undefined {
        let item = this.getItem(this.slots[index]);

        if (item.undroppable && drop) {
            this.notifyCallback?.('You cannot drop this item.');
            return;
        }

        return super.remove(index, count, drop);
    }
}
