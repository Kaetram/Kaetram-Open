import Menu from './menu';

import Util from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type Inventory from './inventory';

type SelectCallback = (index: number) => void;
type ConfirmCallback = (index: number, shardIndex: number) => void;
export default class Enchant extends Menu {
    public override identifier: number = Modules.Interfaces.Enchant;

    private list: HTMLUListElement = document.querySelector('#enchant-inventory-slots')!;

    // Selected items for the enchanting process.
    private selectedItem: HTMLElement = document.querySelector('#enchant-item-selected > div')!;
    private selectedShards: HTMLElement = document.querySelector('#enchant-item-shards > div')!;
    private selectedShardsCount: HTMLElement = document.querySelector('#enchant-item-count')!;

    // Confirm button
    private confirmButton: HTMLElement = document.querySelector('#enchant-item-confirm')!;

    // Selected elements for packet data
    private selectedSlot = -1; // Item slot
    private selectedShard = -1; // Shard slot

    // Callbacks for the enchanting process.
    private selectCallback?: SelectCallback;
    private confirmCallback?: ConfirmCallback;

    public constructor(private inventory: Inventory) {
        super('#enchant', '#close-enchant');

        // Event listeners for selected slots.
        this.selectedItem.addEventListener('click', this.clear.bind(this));
        this.selectedShards.addEventListener('click', this.clear.bind(this));
        this.confirmButton.addEventListener('click', this.confirm.bind(this));

        // Create an empty inventory slot list.
        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++)
            this.list.append(
                Util.createSlot(Modules.ContainerType.Inventory, i, this.select.bind(this))
            );
    }

    /**
     * Synchronizes the slot data between the store and the inventory.
     */

    public override synchronize(): void {
        if (!this.isVisible()) return;

        this.clearSelections();

        this.inventory.forEachSlot((index: number, slot: HTMLElement) => {
            let image = this.getElement(index).querySelector<HTMLElement>('.item-image')!,
                count = this.getElement(index).querySelector<HTMLElement>('.item-count')!,
                slotImage = slot.querySelector<HTMLElement>('.item-image')!;

            if (!slotImage) return;

            image.style.backgroundImage = slotImage.style.backgroundImage;
            count.textContent = slot.textContent;
        });
    }

    /**
     * Override for showing the enchantment menu. We ensure we synchronize with the
     * inventory every time we open the menu.
     */

    public override show(): void {
        super.show();

        this.synchronize();
    }

    /**
     * Creates a callback for when an item is selected. Sends a packet to the
     * server with the selected slot and selected shard slot (index).
     */

    private confirm(): void {
        // Client-sided prevention for sending an invalid packet.
        if (this.selectedSlot === -1 || this.selectedShard === -1) return;

        this.confirmCallback?.(this.selectedSlot, this.selectedShard);
    }

    /**
     * Sends a packet to the server in order to verify the item that was selected. Depending on the
     * type of item (normal or shard) we will assign it to the correct slot.
     * @param _type (Unused) The type of container we are selecting from.
     * @param index The index in the inventory container where we clicked.
     */

    private select(_type: Modules.ContainerType, index: number): void {
        this.selectCallback?.(index);
    }

    /**
     * Moves an item from the inventory to the enchantment menu. If the item is a shard, it will
     * move all the shards to the shard slot.
     * @param index The index of the item we are moving.
     * @param isShard Whether the item is a shard or not (determined by the server).
     */

    public move(index: number, isShard = false): void {
        let image = this.getElement(index).querySelector<HTMLElement>('.item-image')!,
            count = this.getElement(index).querySelector<HTMLElement>('.item-count')!;

        // We already have an item selected, move it back to the inventory.
        if (this.selectedSlot !== -1 && !isShard) {
            let element = this.getElement(this.selectedSlot),
                elementImage = element.querySelector<HTMLElement>('.item-image')!;

            elementImage.style.backgroundImage = this.selectedItem.style.backgroundImage;
        }

        // We already have a shard selected, move it back to the inventory.
        if (this.selectedShard !== -1 && isShard) {
            let element = this.getElement(this.selectedShard),
                elementImage = element.querySelector<HTMLElement>('.item-image')!,
                elementCount = element.querySelector<HTMLElement>('.item-count')!;

            elementImage.style.backgroundImage = this.selectedShards.style.backgroundImage;
            elementCount.textContent = this.selectedShardsCount.textContent;
        }

        // If the item is a shard, we will move all the shards to the shard slot.
        if (isShard) this.selectedShard = index;
        else this.selectedSlot = index;

        // Update the slot depending on whether or not the item is a shard.
        (isShard ? this.selectedShards : this.selectedItem).style.backgroundImage =
            image.style.backgroundImage;

        // Shards also have counts so we will update that as well.
        if (isShard) this.selectedShardsCount.textContent = count.textContent;

        // Remove the item from the inventory slot (and its count).
        image.style.backgroundImage = '';
        count.textContent = '';
    }

    /**
     * Cleans everything up and re-synchronizes the inventory with default values.
     */

    private clear(): void {
        this.clearSelections();

        this.synchronize();
    }

    /**
     * Clears all the selections from the user interface enchantment menu.
     */

    private clearSelections(): void {
        this.selectedSlot = -1;
        this.selectedShard = -1;

        // Reset the slot images and text.
        this.selectedItem.style.backgroundImage = '';
        this.selectedShards.style.backgroundImage = '';
        this.selectedShardsCount.textContent = '';
    }

    /**
     * Grabs the HTMLElement at a specified index within the
     * inventory slot list.
     * @param index The index of the element to grab.
     * @returns The HTMLElement at the specified index.
     */

    private getElement(index: number): HTMLElement {
        return this.list.children[index] as HTMLElement;
    }

    /**
     * Callback for when an item in the inventory is selected. A packet
     * is sent to the server.
     * @param callback Contains the index of the item that was selected.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }

    /**
     * Callback for when the player confirms their selection and attempts
     * to enchant an item using the shards.
     * @param callback Contains the index of the item and the shard index.
     */

    public onConfirm(callback: ConfirmCallback): void {
        this.confirmCallback = callback;
    }
}
