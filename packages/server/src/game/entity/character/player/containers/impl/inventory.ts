import Container from '../container';

import { Modules } from '@kaetram/common/network';

import type { SlotData } from '@kaetram/common/types/slot';
import type Item from '../../../../objects/item';

export default class Inventory extends Container {
    public constructor(size: number) {
        super(Modules.ContainerType.Inventory, size);
    }

    public override add(item: Item): boolean {
        if (!super.add(item)) {
            this.notifyCallback?.('You do not have enough space in your inventory.');
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
        // Ensure the index is within the bounds of the inventory.
        if (index < 0 || index >= this.size) return;

        let item = this.getItem(this.slots[index]);

        if (item.undroppable && drop) {
            this.notifyCallback?.('You cannot drop this item.');
            return;
        }

        return super.remove(index, count, drop);
    }
}
