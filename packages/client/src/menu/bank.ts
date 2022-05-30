import Menu from './menu';
import Inventory from './inventory';

import log from '../lib/log';

import { Modules } from '@kaetram/common/network';

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
            this.bankList.append(this.createSlot(Modules.ContainerType.Bank, i));

        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++)
            this.inventoryList.append(this.createSlot(Modules.ContainerType.Inventory, i));
    }

    /**
     * Initializes the selection process. A callback is created so that
     * the menu controller can send specified request to the server.
     * @param type Which container is being acted on (inventory or bank).
     * @param index The index of the item being acted on.
     */

    private select(type: Modules.ContainerType, index: number): void {
        this.selectCallback?.(type, index);

        console.log(`Selected ${type} ${index}`);
    }

    /**
     * Synchronizes the slot data between the bank and the inventory.
     */

    private synchronize(): void {
        this.inventory.forEachSlot((index: number, slot: HTMLElement) => {
            let image = this.getInventoryElement(index).querySelector('.bank-image') as HTMLElement,
                count = this.getInventoryElement(index).querySelector('.item-count') as HTMLElement;

            image.style.backgroundImage = slot.style.backgroundImage;
            count.textContent = slot.textContent;
        });
    }

    /**
     * Displays the bank interface.
     */

    public override show(): void {
        super.show();

        this.synchronize();
    }

    /**
     * Hides the bank and clears all the bank slots.
     */

    public override hide(): void {
        super.hide();
    }

    /**
     * Creates a new slot element based using the bank-slot class. This creates
     * an empty skeleton that we can then place items in. A callback event listener
     * is also created alongside the slot. Whenever a slot is clicked, its type
     * and index are parameters that are passed to the callback.
     * @param type The type of slot we are creating (used for callback as well).
     * @param index Index of the slot we are creating (for identification).
     */

    private createSlot(type: Modules.ContainerType, index: number): HTMLElement {
        let listElement = document.createElement('li'),
            slot = document.createElement('div'),
            image = document.createElement('div'),
            count = document.createElement('div');

        // Sets the class of the bank slot.
        slot.classList.add('bank-slot');

        // Sets the class of the image.
        image.classList.add('bank-image');

        // Sets the class of the count.
        count.classList.add('item-count');

        // Appends image and count onto the bank slot.
        slot.append(image);
        slot.append(count);

        slot.addEventListener('click', () => this.select(type, index));

        // Appends the bank slot onto the list element.
        listElement.append(slot);

        return listElement;
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
