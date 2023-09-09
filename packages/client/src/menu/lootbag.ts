import Menu from './menu';

import Utils from '../utils/util';

import { Modules, Opcodes } from '@kaetram/common/network';

import type Inventory from './inventory';
import type { SlotData } from '@kaetram/common/types/slot';
import type { LootBagPacketData } from '@kaetram/common/types/messages/outgoing';

type SelectCallback = (index: number) => void;

interface LootElement extends HTMLLIElement {
    index: number; // The actual index of the item on the server-side?
}

export default class LootBag extends Menu {
    public override identifier: number = Modules.Interfaces.Lootbag;

    private itemList: HTMLUListElement = document.querySelector('#lootbag-items > ul')!;
    private inventoryList: HTMLUListElement = document.querySelector('#lootbag-inventory > ul')!;

    private selectCallback?: SelectCallback;

    public constructor(private inventory: Inventory) {
        super('#lootbag', '#close-lootbag');

        // Create empty slots using the default inventory size.
        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++)
            this.inventoryList.append(Utils.createSlot(Modules.ContainerType.LootBag, i));
    }

    /**
     * Responsible for displaying the loot bag menu.
     * @param opcode The type of action we are performing.
     * @param info Contains the items that are in the loot bag.
     */

    public handle(opcode: Opcodes.LootBag, info: LootBagPacketData): void {
        switch (opcode) {
            case Opcodes.LootBag.Open: {
                this.loadItems(info.items!);

                return this.show();
            }

            case Opcodes.LootBag.Take: {
                return this.take(info.index!);
            }

            case Opcodes.LootBag.Close: {
                return this.hide();
            }
        }
    }

    /**
     * Synchronizes the information between the inventory and the loot bag interface.
     */

    public override synchronize(): void {
        if (!this.isVisible()) return;

        this.inventory.forEachSlot((index: number, slot: HTMLElement) => {
            let image: HTMLElement = this.getInventoryElement(index).querySelector('.item-image')!,
                slotImage = slot.querySelector<HTMLElement>('.item-image')!;

            if (!slotImage) return;

            image.style.backgroundImage = slotImage.style.backgroundImage;
        });
    }

    /**
     * Override for the `show()` function that inclues synchronization
     * between the inventory and the loot bag interface.
     */

    public override show(): void {
        super.show();

        this.synchronize();
    }

    /**
     * Removes an item from the loot bag at a specified index.
     * @param index The index of the item to remove.
     */

    private take(index: number): void {
        let element = this.getLootElement(index);

        if (!element) return;

        element.remove();
    }

    /**
     * Loads the items received from the server into the loot bag list. Note that the
     * item's index represents the slot identifier, so when we click on it and want
     * to take an item from the loot bag, we send the slot data's index, not the index
     * of the element we are creating.
     * @param items The list of items to load into the loot bag.
     */

    private loadItems(items: SlotData[]): void {
        // Clear the current list of items.
        this.itemList.innerHTML = '';

        // Iterate through the items and create a new inventory slot for each one.
        for (let item of items) {
            let element = Utils.createSlot(
                    Modules.ContainerType.LootBag,
                    item.index,
                    () => this.selectCallback?.(item.index)
                ) as LootElement,
                image: HTMLElement = element.querySelector('.item-image')!;

            if (image) image.style.backgroundImage = Utils.getImageURL(item.key);

            element.index = item.index;

            this.itemList.append(element);
        }
    }

    /**
     * Obtains a loot element based on the index of the item it represents. Note
     * that this index is not the same as the element's index as a child in the list.
     * @param index The index of the item to grab.
     * @returns An HTMLElement representing the item at the specified index.
     */

    private getLootElement(index: number): HTMLElement | undefined {
        for (let child of this.itemList.children)
            if ((child as LootElement).index === index) return child as HTMLElement;

        return undefined;
    }

    /**
     * Grabs the HTMLElement at a specified index within the
     * inventory slot list.
     * @param index The index of the element to grab.
     * @returns The HTMLElement at the specified index.
     */

    private getInventoryElement(index: number): HTMLElement {
        return this.inventoryList.children[index] as HTMLElement;
    }

    /**
     * Callback for when the user clicks on an item in the loot bag. We
     * send a packet to the server with this action.
     * @param callback Contains the index of the item that was clicked.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
