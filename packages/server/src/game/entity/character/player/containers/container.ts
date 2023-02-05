import Slot from './slot';

import Item from '../../../objects/item';

import _ from 'lodash-es';

import type { Modules } from '@kaetram/common/network';
import type { ContainerItem } from '@kaetram/common/types/item';
import type { SlotData } from '@kaetram/common/types/slot';

interface SerializedContainer {
    slots: SlotData[];
}

export default abstract class Container {
    protected slots: Slot[] = [];

    protected ignoreMaxStackSize = false;

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
        _.each(items, (item: ContainerItem) => {
            // Create a new item instance so that the item's data is created.
            if (!item.key) return;

            if (item.count < 1) item.count = 1;

            this.slots[item.index].update(this.getItem(item), this.ignoreMaxStackSize);
        });

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
        let { count } = item,
            /** The slot where the item should be added */
            slot = this.find(item),
            /** The total amount of items added */
            total = 0;

        // If the slot exists...
        if (slot) {
            // Add the items in the slot to the item to be added
            if (slot.count > 0) item.count += slot.count;

            // Update the slot with the new item count
            slot.update(item, this.ignoreMaxStackSize);

            // Set the total to the new item count
            total += slot.count;

            // If the total count is less than the count of the item to be added...
            if (total < count) {
                // Subtract the total from the item count
                item.count -= total;

                // Add the item to the slot, and store the amount added
                let amount = this.add(item);

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
     * in each slot and increment the amount of slots we've removd until we've removed `count` amount.
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

        let item = this.getItem(this.get(fromIndex));

        // Prevent an item from being moved if it exceeds the max stack size.
        if (item.count > item.maxStackSize) item.count = item.maxStackSize;

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
        let fromSlot = this.get(fromIndex),
            fromItem = this.getItem(fromSlot);

        // If the target slot is undefined, move the item to the next available slot
        // in the container
        if (toIndex === undefined) {
            fromItem.count = 1;
            // Attempt to add the item to the container
            let amount = toContainer.add(fromItem);

            // If the item was added, remove one from the source container
            if (amount > 0) this.remove(fromIndex, 1);
        } else {
            // If the source and target containers are the same and the source
            // and target slots are the same, exit this function
            if (this.type === toContainer.type && fromIndex === toIndex) return;

            // Get the target slot
            let toSlot = toContainer.get(toIndex),
                // Check if the target slot is empty
                isEmpty = toSlot.isEmpty(),
                // If the target slot is not empty, get the item in the target slot
                toItem: Item | undefined;

            if (!isEmpty) toItem = toContainer.getItem(toSlot);

            // Prevent multiple non-stackable from being moved around for safety.
            if (
                toItem &&
                // Check if the source item is not stackable and the count is greater than 1
                ((!fromItem.stackable && fromItem.count > 1) ||
                    // Check if the target item is not stackable and the count is greater than 1
                    (!toItem.stackable && toItem.count > 1))
            )
                return;

            if (isEmpty || (toItem && fromItem.key === toItem.key)) {
                // If the target slot is empty or the target slot contains the same
                // item as the source slot
                // Get the count of the item in the target slot
                let toCount = isEmpty ? 0 : toItem!.count;

                // Add the count of the item in the target slot to the count of
                // the item in the source slot
                fromItem.count += toCount;
                // Update the item in the target slot with the item in the source
                // slot
                toSlot.update(fromItem, toContainer.ignoreMaxStackSize);

                // If the count of the item in the target slot is greater than zero,
                // remove the difference in count from the source slot
                if (toSlot.count > 0) this.remove(fromIndex, toSlot.count - toCount);
                // else fromItem.count -= toCount;
            } else {
                // Update the item in the target slot with the item in the source
                // slot
                toSlot.update(fromItem, toContainer.ignoreMaxStackSize);

                // If the count of the item in the target slot is less than the
                // count of the item in the source slot
                if (toSlot.count < fromItem.count) {
                    // Remove the count of the item in the target slot from the
                    // source slot
                    this.remove(fromIndex, toSlot.count);

                    // Add the item in the target slot to the container
                    this.add(toItem!);
                } else fromSlot.update(toItem!, this.ignoreMaxStackSize);
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
     * Iterates through the slots and returns the slot that contains
     * the `item` parameter.
     * @param item The item we are trying to find.
     * @returns The slot containing the key we are trying to find.
     */

    public find(item: Item): Slot | undefined {
        return this.slots.find(
            (slot) =>
                slot.canHoldSome(item) &&
                (slot.count < item.maxStackSize || this.ignoreMaxStackSize)
        );
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
        _.each(this.slots, callback);
    }

    /**
     * Iterates through each slot and serializes it.
     * @param clientInfo Whether or not we are sending this data to the client.
     * @returns An array of serialized slot data.
     */

    public serialize(clientInfo = false): SerializedContainer {
        let slots: SlotData[] = [];

        _.each(this.slots, (slot: Slot) => slots.push(slot.serialize(clientInfo)));

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
