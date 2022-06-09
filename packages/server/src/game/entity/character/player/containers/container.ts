import _ from 'lodash';

import { Modules } from '@kaetram/common/network';
import { ContainerItem } from '@kaetram/common/types/item';
import { SlotData } from '@kaetram/common/types/slot';

import Slot from './slot';
import Item from '../../../objects/item';

interface SerializedContainer {
    slots: SlotData[];
}

export default abstract class Container {
    private slots: Slot[] = [];

    private emptySpaces = 0;

    private loadCallback?: (skip?: boolean) => void;

    protected addCallback?: (slot: Slot) => void;
    protected removeCallback?: (
        slot: Slot,
        key: string,
        count: number,
        drop?: boolean | undefined
    ) => void;
    protected notifyCallback?: (message: string) => void;

    public constructor(public type: Modules.ContainerType, private size: number) {
        // Create `size` amount of slots with empty data.
        for (let i = 0; i < size; i++) this.slots.push(new Slot(i));

        this.emptySpaces = size;
    }

    /**
     * Fill each slot with manual data from the database.
     * @param items List of container items to load.
     */

    public load(items: ContainerItem[]): void {
        _.each(items, (item: ContainerItem) => {
            // Create a new item instance so that the item's data is created.
            if (!item.key) return;

            this.slots[item.index].update(this.getItem(item));

            this.emptySpaces--;
        });

        this.loadCallback?.();
    }

    /**
     * Takes an item object and updates it into the slot if it exists,
     * otherwise it adds it to an empty slot.
     * @param item Item object in the world.
     * @returns Whether or not adding was successful.
     */

    public add(item: Item): boolean {
        // Return whether or not the adding was successful.
        let added = false,
            slot: Slot | undefined;

        // Item is stackable and we already have it.
        if (item.stackable && this.canHold(item)) {
            slot = this.find(item)!;

            added = !!slot?.add(item.count);

            // If a new item was stacked, we don't lose an empty space.
            if (added) this.emptySpaces++;
        }

        // All slots are taken.
        if (!this.hasSpace()) return false;

        // Update the next empty slot.
        if (!added) {
            slot = this.getEmptySlot();

            if (slot) {
                slot.update(item);

                added = true;
            }
        }

        if (added) {
            this.emptySpaces--;
            this.addCallback?.(slot!);
        }

        return added;
    }

    /**
     * Removes an item at a specified index and returns the serialized slot.
     * @param index Index of where to remove the item.
     * @param count The amount of the item we are dropping.
     * @param drop Conditional that determines if the item should spawn.
     */

    public remove(index: number, count = 1, drop = false): SlotData | undefined {
        let slot = this.slots[index];

        if (!slot || !slot.key) return;

        count = Math.min(count, slot.count);

        let serializedSlot = slot.serialize();

        if (count < slot.count) slot.remove(count);
        else slot.clear();

        this.emptySpaces++;
        this.removeCallback?.(slot, serializedSlot.key, count, drop);

        return serializedSlot;
    }

    /**
     * Moves an item from the `container` parameter into the current
     * container instance.
     * @param container Container instance we are removing data from.
     * @param index Index in the container we are grabbing data from.
     */

    public move(container: Container, index: number): void {
        if (container.get(index).isEmpty()) return;

        let item = container.getItem(container.get(index));

        if (this.add(item)) container.remove(index, item.count);
    }

    /**
     * Swaps an item from one slot to another slot.
     * @param fromIndex Index of the slot we are swapping from.
     * @param toIndex Index of the slot we are swapping with.
     */

    public swap(fromIndex: number, toIndex: number): void {
        let fromSlot = this.get(fromIndex),
            toSlot = this.get(toIndex),
            fromItem = this.getItem(fromSlot),
            toItem;

        if (toSlot.isEmpty()) this.remove(fromIndex, fromItem.count);
        else toItem = this.getItem(toSlot);

        toSlot.update(fromItem);

        if (toItem) fromSlot.update(toItem);

        this.loadCallback?.(true);
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
        return new Item(slot.key, -1, -1, true, slot.count, slot.ability, slot.abilityLevel);
    }

    /**
     * Checks the inventory if it contains an item and a count.
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
        return this.slots.find((slot) => slot.canHold(item));
    }

    /**
     * Checks if an item can be held in the container.
     * @param item Item to check.
     */

    public canHold(item: Item): boolean {
        return this.slots.some((slot) => slot.canHold(item));
    }

    /**
     * Checks if there are empty spaces in the container.
     * @returns Whether the amount of empty spaces is greater than 0.
     */

    public hasSpace(): boolean {
        return this.emptySpaces > 0;
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
     * Iterates through the slots and returns each one.
     * @param callback Slot currently being iterated.
     */

    public forEachSlot(callback: (slot: Slot) => void): void {
        _.each(this.slots, callback);
    }

    /**
     * Iterates through each slot and serializes it.
     * @returns An array of serialized slot data.
     */

    public serialize(): SerializedContainer {
        let slots: SlotData[] = [];

        _.each(this.slots, (slot: Slot) => slots.push(slot.serialize()));

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
