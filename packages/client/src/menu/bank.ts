import { Modules } from '@kaetram/common/network';
import _ from 'lodash-es';

import log from '../lib/log';
import Util from '../utils/util';

import Menu from './menu';

import type Inventory from './inventory';
import type { SlotData } from '@kaetram/common/types/slot';

type SelectCallback = (type: Modules.ContainerType, index: number) => void;

export default class Bank extends Menu {
    private bankList: HTMLUListElement = document.querySelector('#bank-slot > ul')!;
    private inventoryList: HTMLUListElement = document.querySelector('#bank-inventory-slots > ul')!;

    private selectCallback?: SelectCallback;

    public constructor(private inventory: Inventory) {
        super('#bank', '#close-bank');

        this.load();
    }

    /**
     * Loads an empty bank interface with no items but the
     * bank and inventory slots. The amount of slots are defined
     * in the module constants.
     */

    private load(): void {
        if (!this.bankList) return log.error('[Bank] Could not find the bank slot list.');
        if (!this.inventoryList) return log.error('[Bank] Could not find the inventory slot list.');

        for (let i = 0; i < Modules.Constants.BANK_SIZE; i++)
            this.bankList.append(
                Util.createSlot(Modules.ContainerType.Bank, i, this.select.bind(this))
            );

        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++)
            this.inventoryList.append(
                Util.createSlot(Modules.ContainerType.Inventory, i, this.select.bind(this))
            );
    }

    /**
     * Initializes the selection process. A callback is created so that
     * the menu controller can send specified request to the server.
     * @param type Which container is being acted on (inventory or bank).
     * @param index The index of the item being acted on.
     */

    private select(type: Modules.ContainerType, index: number): void {
        this.selectCallback?.(type, index);
    }

    /**
     * Sets the slot in the bank list at a specified index. Updates the image
     * and the count of the item.
     * @param index The index of the slot we are setting.
     * @param key The key of the image, defaults to a blank string to clear the slot image.
     * @param count The amount of an item in the slot, defaults to 0 to clear the slot.
     */

    private setSlot(index: number, key = '', count = 0): void {
        let image = this.getBankElement(index).querySelector('.bank-image') as HTMLElement,
            countElement = this.getBankElement(index).querySelector('.item-count') as HTMLElement;

        image.style.backgroundImage = Util.getImageURL(key);
        countElement.textContent = Util.getCount(count);
    }

    /**
     * Synchronizes the slot data between the bank and the inventory.
     */

    public override synchronize(): void {
        if (!this.isVisible()) return;

        this.inventory.forEachSlot((index: number, slot: HTMLElement) => {
            let image = this.getInventoryElement(index).querySelector('.bank-image') as HTMLElement,
                count = this.getInventoryElement(index).querySelector('.item-count') as HTMLElement;

            image.style.backgroundImage = slot.style.backgroundImage;
            count.textContent = slot.textContent;
        });
    }

    /**
     * Adds an item to the bank list by updating the slot data.
     */

    public override add(slot: SlotData): void {
        this.setSlot(slot.index, slot.key, slot.count);
    }

    /**
     * Updates the slot data of the bank list.
     */

    public override remove(slot: SlotData): void {
        this.setSlot(slot.index, slot.key, slot.count);
    }

    /**
     * Displays the bank interface.
     */

    public override show(slots: SlotData[]): void {
        super.show();

        this.synchronize();

        // Set all slots to the new data.
        _.each(slots, (slot: SlotData) => this.setSlot(slot.index, slot.key, slot.count));
    }

    /**
     * Hides the bank and clears all the bank slots.
     */

    public override hide(): void {
        super.hide();
    }

    /**
     * Grabs the bank HTML element at a specified index.
     * @param index The index of the bank slot.
     * @returns An HTMLElement div within the list at the specified index.
     */

    private getBankElement(index: number): HTMLElement {
        return this.bankList.children[index].querySelector('div') as HTMLElement;
    }

    /**
     * Grabs the HTMLElement at a specified index within the
     * inventory slot list.
     * @param index The index of the element to grab.
     * @returns The HTMLElement at the specified index.
     */

    private getInventoryElement(index: number): HTMLElement {
        return this.inventoryList.children[index].querySelector('div') as HTMLElement;
    }

    /**
     * Callback used for whenever a slot is selected. This is used
     * by an external controller in order to make requests to the server.
     * @param callback Contains the type of container that is
     * being clicked, as well as the index of the slot.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
