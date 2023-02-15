import Container from '../container';

import { Modules } from '@kaetram/common/network';
import InventoryEn from '@kaetram/common/text/en/inventory';

import type { SlotData } from '@kaetram/common/types/slot';
import type Item from '../../../../objects/item';

export default class Inventory extends Container {
    public constructor(size: number) {
        super(Modules.ContainerType.Inventory, size);
    }

    /**
     * Override for the container `add` function where we send a notification.
     * @param item The item to add to the container.
     * @returns Whether or not the item was successfully added.
     */

    public override add(item: Item): number {
        let amount = super.add(item);

        if (amount < 1) {
            this.notifyCallback?.(InventoryEn.NOT_ENOUGH_SPACE);
            return 0;
        }

        item.despawn(true);

        return amount;
    }

    /**
     * Override for the container remove function with added functionality for prevention
     * of special items being dropped (generally applies to quest-related items).
     * @param index The index of the item to remove.
     * @param count The amount of items to remove.
     * @param drop Whether or not the item is being dropped.
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
