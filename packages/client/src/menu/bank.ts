import Menu from './menu';

import log from '../lib/log';
import Util from '../utils/util';

import _ from 'lodash-es';
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

    private selectedContainer: Modules.ContainerType = Modules.ContainerType.Bank;
    private selectedSlot = -1;

    private isTouchDragging = false;
    private touchDragTimeout?: number;
    private dragClone: HTMLElement | undefined;

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
     * @param container The type of container the slot is in.
     * @returns The slot element.
     */

    private draggableSlot(
        index: number,
        container: Modules.ContainerType,
        defaultContainer: Modules.ContainerType
    ): HTMLLIElement {
        let slot = Util.createSlot(container, index, () =>
                this.select(container, index, defaultContainer)
            ),
            item = slot.querySelector<HTMLDivElement>('.item-slot')!;

        slot.addEventListener('dragstart', (event) => this.dragStart(event, index, container));
        slot.addEventListener('drop', (event: DragEvent) => this.dragDrop(event));
        slot.addEventListener('dragover', (event: DragEvent) => this.dragOver(event));
        slot.addEventListener('dragleave', (event: DragEvent) => this.dragLeave(event));

        slot.addEventListener('touchstart', () => this.touchStart(index, container));
        slot.addEventListener('touchmove', (event) => this.touchMove(event, item));
        slot.addEventListener('touchcancel', () => this.touchCancel(item));
        slot.addEventListener('touchend', (event) => this.touchEnd(event, container, index, item));
        slot.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            event.stopPropagation();

            this.isTouchDragging = true;
        });

        return slot;
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
                '.inventory-item-count'
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
            let image = this.getInventoryElement(index).querySelector<HTMLElement>('.item-image')!,
                count =
                    this.getInventoryElement(index).querySelector<HTMLElement>(
                        '.inventory-item-count'
                    )!,
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
        _.each(slots, (slot: SlotData) => {
            if (!slot.key) return;

            this.setSlot(slot);
        });
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
        _.each(slots, (slot: SlotData) => this.setSlot(slot));
    }

    /**
     * Hides the bank and clears all the bank slots.
     */

    public override hide(): void {
        super.hide();
    }

    /**
     * Event handler for when a slot begins the dragging and dropping
     * process. We update the current index of the slot that is being
     * selected for later use.
     * @param index The index of the slot being dragged.
     */

    private dragStart(event: Event, index: number, container: Modules.ContainerType): void {
        if (this.inventory.isEmpty(this.getElement(index, container))) {
            event.preventDefault();
            event.stopPropagation();

            return;
        }

        this.selectedSlot = index;
        this.selectedContainer = container;
    }

    /**
     * The drop event within the drag and drop actions. The target represents
     * the slot that the item is being dropped into.
     * @param event Contains event data about the target.
     */

    private dragDrop(event: DragEvent): void {
        let element = event.target as HTMLElement,
            toContainer = element?.dataset?.type,
            toIndex = element?.dataset?.index;

        if (!element) return;

        // Remove the selected slot class property.
        element.classList.remove('item-slot-focused');

        if (this.selectedSlot === -1) return;

        this.select(
            this.selectedContainer,
            this.selectedSlot,
            parseInt(toContainer!),
            parseInt(toIndex!)
        );

        // Reset the selected slot after.
        this.selectedSlot = -1;
    }

    /**
     * Event handler for when a slot is being dragged over (but not dropped).
     * We use this to give the user feedback on which slot they are hovering.
     * @param event Contains event data and the slot element that is being hovered.
     */

    private dragOver(event: DragEvent): void {
        // Check that a target exists firstly.
        if (!event.target || !(event.target as HTMLElement).draggable) return;

        event.preventDefault();

        // Add the slot focused class property.
        (event.target as HTMLElement).classList.add('item-slot-focused');
    }

    /**
     * Event handler for when an item being dragged exits a valid slot area.
     * @param event Contains the target slot that is exited.
     */

    private dragLeave(event: DragEvent): void {
        // Remove the slot focused class.
        (event.target as HTMLElement).classList.remove('item-slot-focused');
    }

    /**
     * Event handler for when a slot begins being touched on a mobile device.
     * @param index Index of the slot being touched.
     */

    private touchStart(index: number, container: Modules.ContainerType): void {
        if (this.inventory.isEmpty(this.getElement(index, container))) return;

        this.selectedSlot = index;
        this.selectedContainer = container;

        this.touchDragTimeout = window.setTimeout(() => {
            this.isTouchDragging = true;
        }, 250);
    }

    /**
     * Event handler for when a slot is being moved on a mobile device.
     * @param event Contains event data about the slot being moved.
     * @param item The item being moved.
     */

    private touchMove(event: TouchEvent, item: HTMLDivElement) {
        if (this.touchDragTimeout) clearTimeout(this.touchDragTimeout);
        if (!this.isTouchDragging || this.selectedSlot === -1) return;

        let [touch] = event.touches;

        item.classList.add('item-slot-focused');

        this.dragClone ??= item.cloneNode(true) as HTMLElement;

        this.dragClone.style.position = 'absolute';
        this.dragClone.style.top = `${touch.clientY - item.clientHeight / 2}px`;
        this.dragClone.style.left = `${touch.clientX - item.clientWidth / 2}px`;
        this.dragClone.style.opacity = '0.75';

        document.querySelector('#game-container')?.append(this.dragClone);
    }

    /**
     * Event handler for when a slot touch is being cancelled.
     * @param item The item being cancelled.
     */

    private touchCancel(item: HTMLDivElement) {
        if (this.touchDragTimeout) clearTimeout(this.touchDragTimeout);
        this.isTouchDragging = false;

        this.dragClone?.remove();
        this.dragClone = undefined;

        item.classList.remove('item-slot-focused');

        this.selectedSlot = -1;
    }

    /**
     * Event handler for when a slot touch is being ended.
     * @param event Contains event data about the slot being ended.
     * @param item The item being ended.
     */

    private touchEnd(
        event: TouchEvent,
        fromContainer: Modules.ContainerType,
        fromIndex: number,
        item: HTMLDivElement
    ) {
        if (!this.isTouchDragging) return;
        this.touchCancel(item);

        let [touch] = event.changedTouches,
            element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null,
            toContainer = element?.dataset?.type,
            toIndex = element?.dataset?.index;

        if (!element || !toContainer || !toIndex) return;

        this.select(fromContainer, fromIndex, parseInt(toContainer), parseInt(toIndex));
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
