import Slot from './slot';

import Item from '../../../objects/item';

import log from '@kaetram/common/util/log';

import type { Modules } from '@kaetram/common/network';
import type { ContainerItem } from '@kaetram/common/types/item';
import type { SlotData } from '@kaetram/common/types/slot';

interface SerializedContainer {
    slots: SlotData[];
}

export default abstract class Container {
    protected slots: Slot[] = [];

    protected stackSize?: number;

    private loadCallback?: () => void;

    protected addCallback?: (slot: Slot) => void;
    protected removeCallback?: (
        slot: Slot,
        key: string,
        count: number,
        drop?: boolean | undefined
    ) => void;
    protected notifyCallback?: (message: string) => void;

    public constructor(public type: Modules.ContainerType, public size: number) {
        // Create `size` amount of slots with empty data.
        for (let i = 0; i < size; i++) this.slots.push(new Slot(i));
    }

    /**
     * Fill each slot with manual data from the database.
     * @param items List of container items to load.
     */

    public load(items: ContainerItem[]): void {
        for (let item of items) {
            // Create a new item instance so that the item's data is created.
            if (!item.key) continue;

            if (item.count < 1) item.count = 1;

            this.slots[item.index].update(this.getItem(item), this.stackSize);
        }

        this.loadCallback?.();
    }

    /**
     * Removes all the items from the container.
     */

    public empty(): void {
        this.forEachSlot((slot: Slot) => this.remove(slot.index, slot.count));
    }

    /**
     * Takes an item object and updates it into the slot if it exists,
     * otherwise it adds it to an empty slot.
     * @param item Item object in the world.
     * @returns The amount of items added.
     */

    public add(item: Item): number {
        let itemCount = item.count,
            /** The slot where the item should be added */
            slot = this.find(item),
            /** The total amount of items added */
            total = 0;

        // If the slot exists...
        if (slot) {
            let itemCopy = item.copy(),
                slotCount = slot.count;

            // Add the items in the slot to the item to be added
            if (slot.count > 0) itemCopy.count += slot.count;

            // Update the slot with the new item count
            slot.update(itemCopy, this.stackSize);

            // Set the total to the new item count
            total += slot.count;

            if (slotCount > 0) total -= slotCount;

            // If the total count is less than the count of the item to be added...
            if (total < itemCount) {
                // Subtract the total from the item count
                itemCopy.count = itemCount - total;

                // Add the item to the slot, and store the amount added
                let amount = this.add(itemCopy);

                // Add the amount to the total
                if (amount > 0) total += amount;
            }
        }

        // Call the add callback with the slot
        if (total > 0) this.addCallback?.(slot!);

        // Return the total amount
        return total;
    }

    /**
     * Removes an item at a specified index and returns the serialized slot.
     * @param index Index of where to remove the item.
     * @param count The amount of the item we are dropping.
     * @param drop Conditional that determines if the item should spawn.
     */

    public remove(index: number, count = 1, drop = false): SlotData | undefined {
        let slot = this.slots[index];

        if (!slot?.key) return;

        count = Math.min(count, slot.count);

        let serializedSlot = slot.serialize();

        if (count < slot.count) slot.remove(count);
        else slot.clear();

        this.removeCallback?.(slot, serializedSlot.key, count, drop);

        return serializedSlot;
    }

    /**
     * Remove an item based on its key and count. First we check if we can find
     * a stackable key and count at an index, otherwise we go through each slot and
     * remove `count` amount. For example, if we have 5 swords, and we want to remove
     * 4, we first check if we can find a slot with a sword and count of 4, since a sword
     * is  not stackable, we jump to the next condition, we iterate each slot, remove the item
     * in each slot and increment the amount of slots we've removed until we've removed `count` amount.
     * @param key The key of the item we are removing.
     * @param count The amount of the item we are removing.
     */

    public removeItem(key: string, count = 1): void {
        let index = this.getIndex(key, count);

        if (index === -1) {
            let removed = 0;

            // Iterate through each slot and exhaust the count we are removing.
            this.forEachSlot((slot: Slot) => {
                // Skip slots if key doesn't match or we've exhausted the removal.
                if (slot.key !== key || removed >= count) return;

                /**
                 * We iterate through each slot and remove maximum amount possible. We keep track of
                 * every item we remove such that we remove counts rather than entire slots. Say slot 1
                 * contains 5 flasks, and slot 2 contains 4 flasks. We want to remove 6 flasks (so we
                 * would be left with 1 flask in slot 2). We iterate through slot 1, remove 5 flasks.
                 * We increment the removed amount by 5, and ensure that from slot 2 we only remove
                 * the difference between the original `count` and the removed amount.
                 */

                // Remove the maximum amount possible.
                let removeCount = count - removed > slot.count ? slot.count : count - removed;

                // Increment the removed amount.
                removed += removeCount;

                // Remove from the slot.
                this.remove(slot.index, removeCount);
            });
        } else this.remove(index, count);
    }

    /**
     * Moves an item from the `container` parameter into the current
     * container instance.
     * @param toContainer Container instance we are removing data from.
     * @param index Index in the container we are grabbing data from.
     */

    public move(fromIndex: number, toContainer: Container, toIndex?: number): void {
        if (this.get(fromIndex).isEmpty()) return;

        let item = this.getItem(this.get(fromIndex)),
            stackSize = this.stackSize || item.maxStackSize;

        // Prevent an item from being moved if it exceeds the max stack size.
        if (item.count > stackSize) item.count = stackSize;

        this.swap(fromIndex, toContainer, toIndex);
    }

    /**
     * Swaps an item from the current container instance into the `container`
     * parameter.
     * @param fromIndex Index in the current container instance we are grabbing data from.
     * @param toContainer Container instance we are removing data from.
     * @param toIndex Index in the container we are grabbing data from.
     */

    public swap(fromIndex: number, toContainer: Container, toIndex?: number) {
        // Return if the source and target containers are the same and the index is the same.
        if (this.type === toContainer.type && fromIndex === toIndex) return;

        let fromSlot = this.get(fromIndex);
        if (fromSlot.isEmpty()) return;

        let fromItem = this.getItem(fromSlot),
            fromStackSize = this.stackSize || fromItem.maxStackSize;

        // If the target slot is undefined, move the item to the next available slot in the container.
        if (toIndex === undefined) {
            fromItem.count = 1;
            // Attempt to add the item to the container
            let amount = toContainer.add(fromItem);

            // Remove the item from the source container if the item was added.
            if (amount > 0) this.remove(fromIndex, 1);
        } else {
            // Get the target slot.
            let toSlot = toContainer.get(toIndex),
                // Check if the target slot is empty.
                toEmpty = toSlot.isEmpty(),
                // If the target slot is not empty, get the item in the target slot.
                toItem!: Item,
                toStackSize!: number,
                isSameItem = false;

            if (!toEmpty) {
                toItem = toContainer.getItem(toSlot);
                toStackSize = toContainer.stackSize || toItem.maxStackSize;
                isSameItem = fromItem.key === toItem.key;

                if (
                    (fromItem.count > (toContainer.stackSize || fromItem.maxStackSize) ||
                        toItem.count > (this.stackSize || toItem.maxStackSize)) &&
                    !isSameItem
                )
                    return;
            }

            if (toEmpty || isSameItem) {
                // Get the count of the item in the target slot.
                let toCount = toEmpty ? 0 : toItem.count;

                // Add the count of the item in the target slot to the count of the item in the source slot.
                fromItem.count += toCount;
                // Update the item in the target slot with the item in the source slot.
                toSlot.update(fromItem, toContainer.stackSize);

                // Remove the item in the source slot from the container.
                if (toSlot.count > 0) this.remove(fromIndex, toSlot.count - toCount);
            } else if (fromItem.count <= fromStackSize && toItem.count <= toStackSize) {
                // Update the item in the target slot with the item in the source slot.
                toSlot.update(fromItem, toContainer.stackSize);

                if (toSlot.count < fromSlot.count) log.critical('WHY HAVE YOU FORSAKEN ME');
                else {
                    fromSlot.update(toItem, this.stackSize);

                    toItem.count -= fromSlot.count;
                    if (toItem.count > 0) log.critical("WHAT IS THIS I DON'T EVEN");
                }
            }
        }

        // Call the load callback for this container
        this.loadCallback?.();
        // Call the load callback for the destination container
        toContainer.loadCallback?.();
    }

    /**
     * Returns the slot at a given index paramater.
     * @param index The index in the slots array.
     * @returns The slot at the index specified.
     */

    public get(index: number): Slot {
        return this.slots[index];
    }

    /**
     * Takes a slot and converts the contents into a serialized item.
     * @param slot The slot we are extracting the item from.
     */

    public getItem(slot: Slot | SlotData | ContainerItem): Item {
        return new Item(slot.key, -1, -1, true, slot.count, slot.enchantments);
    }

    /**
     * Checks the container if it contains an item and a count.
     * @param key The key of the item we're trying to find.
     * @param count Default one but can be specified to check if `x` amount of an item is contained in the slot.
     * @returns The slot index of the item we're trying to find otherwise -1.
     */

    public getIndex(key?: string, count = 1): number {
        return this.slots.findIndex((slot) => slot.key === key && slot.count >= count);
    }

    /**
     * Finds a slot with the same item or an empty slot.
     * @param item The item to find a slot for.
     * @returns Either a slot with the same item or an empty slot.
     */

    public find(item: Item): Slot | undefined {
        let stackSize = this.stackSize || item.maxStackSize,
            // Find a slot with the same item.
            sameItemSlot = this.slots.find(
                (slot) =>
                    // If the slot's key matches the item's key
                    slot.key === item.key &&
                    // And the slot's count is less than the item's max stack size or we're ignoring the max stack size.
                    slot.count < stackSize
            );

        // If there's no slot with the same item, find an empty slot.
        return sameItemSlot || this.getEmptySlot();
    }

    /**
     * Checks if there are empty spaces in the container.
     * @returns Whether or not we can find a slot that is empty.
     */

    public hasSpace(): boolean {
        return !!this.getEmptySlot();
    }

    /**
     * Checks if the container contains an item (and a count). If it's not stackable,
     * we must count the amount of items in the container.
     * @param key The key of the item we are looking for.
     * @param count Optional amount of items we are looking for.
     */

    public hasItem(key: string, count = 1): boolean {
        let contains = false;

        // Check to see if the item is a stackable kind first.
        if (this.getIndex(key, count) === -1) {
            // Search through the slots to see if we can find `count` amount of occurrences.
            let found = 0;

            this.forEachSlot((slot: Slot) => {
                if (slot.key !== key) return;

                found += slot.count;
            });

            // We found `count` or more occurrences of an item.
            if (found >= count) contains = true;
        } else contains = true;

        return contains;
    }

    /**
     * Since `emptySpaces` is always updated, the next available empty slot
     * is the size of the container minus the empty spaces available.
     * @returns An empty slot.
     */

    private getEmptySlot(): Slot | undefined {
        return this.slots.find((slot) => !slot.key);
    }

    /**
     * @returns The total amount of empty slots.
     */

    public getEmptySlots(): number {
        return this.slots.filter((slot) => !slot.key).length;
    }

    /**
     * Iterates through the slots and returns each one.
     * @param callback Slot currently being iterated.
     */

    public forEachSlot(callback: (slot: Slot) => void): void {
        for (let slot of this.slots) callback(slot);
    }

    /**
     * Iterates through each slot and serializes it.
     * @param clientInfo Whether or not we are sending this data to the client.
     * @returns An array of serialized slot data.
     */

    public serialize(clientInfo = false): SerializedContainer {
        let slots: SlotData[] = [];

        for (let slot of this.slots) slots.push(slot.serialize(clientInfo));

        return { slots };
    }

    /**
     * A signal when the container is loaded.
     */

    public onLoaded(callback: () => void): void {
        this.loadCallback = callback;
    }

    /**
     * Signal for when an item is added.
     */

    public onAdd(callback: (slot: Slot) => void): void {
        this.addCallback = callback;
    }

    /**
     * Signal for when an item is removed.
     */

    public onRemove(
        callback: (slot: Slot, key: string, count: number, drop?: boolean) => void
    ): void {
        this.removeCallback = callback;
    }

    /**
     * A callback sent back to the player to send a notification.
     * @param callback A callback containing the message to notify the player with.
     */

    public onNotify(callback: (message: string) => void): void {
        this.notifyCallback = callback;
    }
}
