import Menu from './menu';

import log from '../lib/log';
import Util from '../utils/util';
import { onDragDrop } from '../utils/press';

import { Modules } from '@kaetram/common/network';

import type { SlotData } from '@kaetram/common/types/slot';
import type Inventory from './inventory';

type SelectCallback = (
    fromContainer: Modules.ContainerType,
    fromIndex: number,
    toContainer: Modules.ContainerType,
    toIndex?: number
) => void;

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

        for (let i = 0; i < Modules.Constants.BANK_SIZE; i++) {
            let slot = this.draggableSlot(
                i,
                Modules.ContainerType.Bank,
                Modules.ContainerType.Inventory
            );

            this.bankList.append(slot);
        }

        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++) {
            let slot = this.draggableSlot(
                i,
                Modules.ContainerType.Inventory,
                Modules.ContainerType.Bank
            );

            this.inventoryList.append(slot);
        }

        this.inventory.onBatch(this.synchronize.bind(this));
    }

    /**
     * Creates a draggable slot for the bank interface.
     * @param index The index of the slot.
     * @param fromContainer The type of container the slot is from.
     * @param defaultContainer The default type of container the slot is going.
     * @returns The slot element.
     */

    private draggableSlot(
        index: number,
        fromContainer: Modules.ContainerType,
        defaultContainer: Modules.ContainerType
    ): HTMLLIElement {
        let slot = Util.createSlot(fromContainer, index, () =>
                this.select(fromContainer, index, defaultContainer)
            ),
            item = slot.querySelector<HTMLDivElement>('.item-slot')!;

        onDragDrop(item, this.handleHold.bind(this), () =>
            this.inventory.isEmpty(this.getElement(index, fromContainer))
        );

        return slot;
    }

    private handleHold(clone: HTMLElement, target: HTMLElement): void {
        let fromContainer = clone?.dataset?.type,
            fromIndex = clone?.dataset?.index,
            toContainer = target?.dataset?.type,
            toIndex = target?.dataset?.index;

        if (!fromContainer || !fromIndex || !toContainer || !toIndex) return;

        this.select(
            parseInt(fromContainer),
            parseInt(fromIndex),
            parseInt(toContainer),
            parseInt(toIndex)
        );
    }

    /**
     * Initializes the selection process. A callback is created so that
     * the menu controller can send specified request to the server.
     * @param fromContainer The type of container the item is being selected from.
     * @param toContainer The type of container the item is being selected to.
     * @param index The index of the item being acted on.
     */

    private select(
        fromContainer: Modules.ContainerType,
        fromIndex: number,
        toContainer: Modules.ContainerType,
        toIndex?: number
    ): void {
        this.selectCallback?.(fromContainer, fromIndex, toContainer, toIndex);
    }

    /**
     * Sets the slot in the bank list at a specified index. Updates the image
     * and the count of the item.
     * @param index The index of the slot we are setting.
     * @param key The key of the image, defaults to a blank string to clear the slot image.
     * @param count The amount of an item in the slot, defaults to 0 to clear the slot.
     */

    private setSlot(slot: SlotData): void {
        let image = this.getBankElement(slot.index).querySelector<HTMLElement>('.item-image')!,
            countElement = this.getBankElement(slot.index).querySelector<HTMLElement>(
                '.item-count'
            )!;

        image.style.backgroundImage = Util.getImageURL(slot.key);
        countElement.textContent = Util.getCount(slot.count);
    }

    /**
     * Synchronizes the slot data between the bank and the inventory.
     */

    public override synchronize(): void {
        if (!this.isVisible()) return;

        this.inventory.forEachSlot((index: number, slot: HTMLElement) => {
            let element = this.getInventoryElement(index),
                image = element.querySelector<HTMLElement>('.item-image')!,
                count = element.querySelector<HTMLElement>('.item-count')!,
                slotImage = slot.querySelector<HTMLElement>('.item-image')!;

            if (!slotImage) return;

            image.style.backgroundImage = slotImage.style.backgroundImage;
            count.textContent = slot.textContent;
        });
    }

    /**
     * Loads the batch data into the bank from the server. Each
     * slot is selected from the list element.
     * @param slots Serialized slots received from the server. We take
     * the index contained within these slots and attribute them
     * to the index within our slot list.
     */

    public override batch(slots: SlotData[]): void {
        for (let slot of slots) {
            if (!slot.key) continue;

            this.setSlot(slot);
        }
    }

    /**
     * Adds an item to the bank list by updating the slot data.
     */

    public override add(slot: SlotData): void {
        this.setSlot(slot);
    }

    /**
     * Updates the slot data of the bank list.
     */

    public override remove(slot: SlotData): void {
        this.setSlot(slot);
    }

    /**
     * Displays the bank interface.
     */

    public override show(slots: SlotData[]): void {
        super.show();

        this.synchronize();

        // Set all slots to the new data.
        for (let slot of slots) this.setSlot(slot);
    }

    /**
     * Hides the bank and clears all the bank slots.
     */

    public override hide(): void {
        super.hide();
    }

    private getElement(index: number, container: Modules.ContainerType): HTMLElement {
        return container === Modules.ContainerType.Bank
            ? this.getBankElement(index)
            : this.getInventoryElement(index);
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
