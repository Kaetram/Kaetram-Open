import _ from 'lodash';

import Menu from './menu';

import log from '../lib/log';
import Util from '../utils/util';

import { Modules } from '@kaetram/common/network';
import { SlotData } from '@kaetram/common/types/slot';

export default class Inventory extends Menu {
    private body: HTMLElement = document.querySelector('#inventory')!;
    private list: HTMLUListElement = document.querySelector('#inventory > ul')!;

    // Button that opens the invnetory.
    private button: HTMLElement = document.querySelector('#inventory-button')!;

    private selectCallback?: (index: number) => void;

    public constructor() {
        super();

        this.load();

        this.button.addEventListener('click', () => this.toggle());
    }

    /**
     * Creates an empty inventory of the size defined in the
     * constants. This may get adapted in the future for potential
     * dynamic inventory sizes, though it has yet to be decided.
     */

    public load(): void {
        if (!this.list) return log.error(`Could not create the skeleton for the inventory.`);

        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++) {
            let slot = this.createSlot(i);

            this.list.append(slot);
        }
    }

    /**
     * Loads the batch data into the inventory from the server. Each
     * slot is selected from the list element.
     * @param slots Serialized slots received from the server. We take
     * the index contained within these slots and attribute them
     * to the index within our slot list.
     */

    public override batch(slots: SlotData[]): void {
        _.each(slots, (slot: SlotData) => {
            if (!slot.key) return;

            this.setSlot(slot.index, slot.key, slot.count);
        });
    }

    /**
     * Uses the slot's index to add an item into our inventory UI.
     * @param slot Contains data about the item we are adding.
     */

    public override add(slot: SlotData): void {
        this.setSlot(slot.index, slot.key, slot.count);
    }

    /**
     * Removes an item from our inventory and resets the slot to
     * its default state.
     * @param slot Contains index of the slot we are removing.
     */

    public override remove(slot: SlotData): void {
        this.setSlot(slot.index, slot.key, slot.count);
    }

    /**
     * Sets the slot's image and count at a specified index. If no key is provided
     * then we remove the slot's `backgroundImage` property and set the count to
     * an empty string.
     * @param index Index at which we are updating the slot data.
     * @param key Optional parameter that is used to get the image for the slot.
     * @param count Integer value to assign to the slot.
     */

    private setSlot(index: number, key = '', count = 1): void {
        let slotElement = this.getElement(index);

        if (!slotElement) return log.error(`Could not find slot element at: ${index}`);

        let countElement = slotElement.querySelector('.inventory-item-count');

        if (countElement) countElement.textContent = Util.getCount(count);

        slotElement.style.backgroundImage = key ? Util.getImageURL(key) : '';
    }

    /**
     * Creates a slot element using the DOM. The slot is
     * used when we want to add an item to the invnetory.
     * @returns A list element containing an empty slot.
     */

    private createSlot(index: number): HTMLElement {
        let slot = document.createElement('li'),
            item = document.createElement('div'),
            count = document.createElement('div');

        // Assign the class to the slot.
        item.classList.add('item-slot');

        // Add the class element onto the count.
        count.classList.add('inventory-item-count');

        // Append the count onto the item slot.
        item.append(count);

        // Append the item onto the slot list element.
        slot.append(item);

        slot.addEventListener('dblclick', () => this.selectCallback?.(index));

        return slot;
    }

    /**
     * Toggles the status of the inventory.
     */

    public toggle(): void {
        if (this.isVisible()) this.hide();
        else this.show();
    }

    /**
     * Displays the bank interface.
     */

    public override show(): void {
        this.body.style.display = 'block';
        this.button.classList.add('active');
    }

    /**
     * Sets the body's display style to `none` and
     * clears all the items from the bank user interface.
     */

    public override hide(): void {
        this.body.style.display = 'none';
        this.button.classList.remove('active');
    }

    /**
     * @returns Whether or not the body is visible.
     */

    private isVisible(): boolean {
        return this.body.style.display === 'block';
    }

    /**
     * Grabs the `div` slot element within the `li` element.
     * @param index The index of the slot we are grabbing.
     * @returns An HTMLElement for the slot.
     */

    private getElement(index: number): HTMLElement {
        return this.list.children[index].querySelector('div') as HTMLElement;
    }

    /**
     * Callback for when an item slot element is selected.
     * @param callback Contains the index of the slot selected.
     */

    public onSelect(callback: (index: number) => void): void {
        this.selectCallback = callback;
    }
}
