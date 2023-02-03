import Menu from './menu';

import log from '../lib/log';
import Util from '../utils/util';

import { Modules, Opcodes } from '@kaetram/common/network';
import _ from 'lodash-es';

import type Actions from './actions';
import type { SlotData } from '@kaetram/common/types/slot';
import type { Bonuses, Stats } from '@kaetram/common/types/item';

type SelectCallback = (index: number, action: Opcodes.Container, value?: number) => void;

interface SlotElement extends HTMLElement {
    edible?: boolean;
    equippable?: boolean;

    name?: string;
    count?: number;
    description?: string;
    attackStats?: Stats;
    defenseStats?: Stats;
    bonuses?: Bonuses;
}

export default class Inventory extends Menu {
    private list: HTMLUListElement = document.querySelector('#inventory-container > ul')!;

    // Used for when we open the action menu interface.
    private selectedSlot = -1;

    private selectCallback?: SelectCallback;

    private touchClone: HTMLElement | undefined;

    public constructor(private actions: Actions) {
        super('#inventory', undefined, '#inventory-button');

        this.load();

        this.actions.onButton((action: Modules.MenuActions) => this.handleAction(action));
        this.actions.onDrop((count: number) => this.handleDrop(count));
    }

    /**
     * Creates an empty inventory of the size defined in the
     * constants. This may get adapted in the future for potential
     * dynamic inventory sizes, though it has yet to be decided.
     */

    public load(): void {
        if (!this.list) return log.error(`Could not create the skeleton for the inventory.`);

        // Create slots based on the constants.
        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++)
            this.list.append(this.createSlot(i));
    }

    /**
     * Handles pressing down a key while the dialogue is open. We redirect any keys
     * from the keyboard into this class when the dialogue is open.
     * @param key The key that was pressed.
     */

    public keyDown(key: string): void {
        switch (key) {
            case 'Escape': {
                return this.actions.hideDropDialog();
            }

            case 'Enter': {
                return this.actions.handleDrop();
            }
        }
    }

    /**
     * Creates a select callback using the action parameter specified.
     * @param menuAction Which type of action is being performed.
     */

    private handleAction(menuAction: Modules.MenuActions): void {
        if (menuAction === Modules.MenuActions.DropMany) return this.actions.showDropDialog();

        this.selectCallback?.(this.selectedSlot, Util.getContainerAction(menuAction), 1);

        this.actions.hide();
    }

    /**
     * Drops an item from the inventory based on the count specified.
     * @param count The amount of items we are dropping.
     */

    private handleDrop(count: number): void {
        return this.selectCallback?.(this.selectedSlot, Opcodes.Container.Remove, count);
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

            this.setSlot(slot);
        });
    }

    /**
     * Uses the slot's index to add an item into our inventory UI.
     * @param slot Contains data about the item we are adding.
     */

    public override add(slot: SlotData): void {
        this.setSlot(slot);
    }

    /**
     * Removes an item from our inventory and resets the slot to
     * its default state.
     * @param slot Contains index of the slot we are removing.
     */

    public override remove(slot: SlotData): void {
        this.setSlot(slot);
    }

    /**
     * Used for updating the currently selected slot while
     * the action menu is open.
     * @param index Index of the slot we are currently selected.
     */

    private select(index: number, doubleClick = false): void {
        let element = this.getElement(index);

        // If the slot is empty, we do not want to select it.
        if (this.isEmpty(element)) return this.actions.hide();

        // Update the currently selected slot.
        this.selectedSlot = index;

        /**
         * When we double click, we only determine if the item is edible or
         * equippable. If any of those properties are true, we skip having
         * to display the action menu and send the packet.
         */

        if (doubleClick) {
            if (element.edible) this.handleAction(Modules.MenuActions.Eat);
            else if (element.equippable) this.handleAction(Modules.MenuActions.Equip);

            this.actions.hide();

            return;
        }

        /**
         * Here we create a list of all the actions pertaining to the slot
         * based on the equippable and edible properties. This list can always
         * be expanded as more item properties are added.
         */

        let actions: Modules.MenuActions[] = [];

        if (element.edible) actions.push(Modules.MenuActions.Eat);
        if (element.equippable) actions.push(Modules.MenuActions.Equip);

        // Push drop option as the last one.
        actions.push(Modules.MenuActions.DropOne);

        if (element.count! > 1) actions.push(Modules.MenuActions.DropMany);

        this.actions.show(
            actions,
            element.name!,
            element.attackStats!,
            element.defenseStats!,
            element.bonuses!,
            element.description
        );
    }

    /**
     * Selects the first edible item in the inventory then mimics the
     * select function as if the player is clicking it. Used for hotkey
     * functions to quickly heal when in combat.
     */

    public selectEdible(): void {
        let index = this.getFirstEdible();

        // No edible items found.
        if (index === -1) return;

        this.selectedSlot = index;

        this.handleAction(Modules.MenuActions.Eat);
    }

    /**
     * Event handler for when a slot begins the dragging and dropping
     * process. We update the current index of the slot that is being
     * selected for later use.
     * @param index The index of the slot being dragged.
     */

    private dragStart(event: Event, index: number): void {
        if (this.isEmpty(this.getElement(index))) {
            event.preventDefault();
            event.stopPropagation();

            return;
        }

        this.selectedSlot = index;
    }

    /**
     * The drop event within the drag and drop actions. The target represents
     * the slot that the item is being dropped into.
     * @param event Contains event data about the target.
     */

    private dragDrop(event: DragEvent, index: number): void {
        let element = event.target as HTMLElement;

        if (!element) return;

        // Remove the selected slot class property.
        element.classList.remove('item-slot-focused');

        if (this.selectedSlot === -1) return;

        // Create a callback used when we swap an item from `selectedSlot` to index.
        this.selectCallback?.(this.selectedSlot, Opcodes.Container.Swap, index);

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

    private touchStart(index: number): void {
        if (this.isEmpty(this.getElement(index))) return;

        this.selectedSlot = index;
    }

    /**
     * Event handler for when a slot is being moved on a mobile device.
     * @param event Contains event data about the slot being moved.
     * @param item The item being moved.
     */

    private touchMove(event: TouchEvent, item: HTMLDivElement) {
        if (this.selectedSlot === -1) return;

        let [touch] = event.touches;

        item.classList.add('item-slot-focused');

        this.touchClone ??= item.cloneNode(true) as HTMLElement;

        this.touchClone.style.position = 'absolute';
        this.touchClone.style.top = `${touch.clientY - item.clientHeight / 2}px`;
        this.touchClone.style.left = `${touch.clientX - item.clientWidth / 2}px`;
        this.touchClone.style.opacity = '0.75';

        document.querySelector('#game-container')?.append(this.touchClone);
    }
    /**
     * Event handler for when a slot touch is being cancelled.
     * @param item The item being cancelled.
     */

    private touchCancel(item: HTMLDivElement) {
        this.touchClone?.remove();
        this.touchClone = undefined;

        item.classList.remove('item-slot-focused');
    }

    /**
     * Event handler for when a slot touch is being ended.
     * @param event Contains event data about the slot being ended.
     * @param item The item being ended.
     */

    private touchEnd(event: TouchEvent, item: HTMLDivElement) {
        this.touchCancel(item);

        let [touch] = event.changedTouches,
            element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null,
            index = element?.dataset?.index;

        if (!index || this.selectedSlot === -1) return;

        // Create a callback used when we swap an item from `selectedSlot` to index.
        this.selectCallback?.(this.selectedSlot, Opcodes.Container.Swap, parseInt(index));

        // Reset the selected slot after.
        this.selectedSlot = -1;
    }

    /**
     * Sets the slot's image and count at a specified index. If no key is provided
     * then we remove the slot's `backgroundImage` property and set the count to
     * an empty string.
     * @param slot Contains information about the slot element.
     */

    private setSlot(slot: SlotData): void {
        let slotElement = this.getElement(slot.index);

        if (!slotElement) return log.error(`Could not find slot element at: ${slot.index}`);

        let imageElement: HTMLElement = slotElement.querySelector('.item-image')!,
            countElement = slotElement.querySelector('.inventory-item-count');

        if (!imageElement) return log.error(`Could not find image element at: ${slot.index}`);

        if (countElement) countElement.textContent = Util.getCount(slot.count);

        imageElement.style.backgroundImage = slot.key ? Util.getImageURL(slot.key) : '';

        // Set data properties for easy testing (see Cypress best practices)
        slotElement.dataset.key = slot.key;
        slotElement.dataset.count = `${slot.count}`;

        // Update the edible and equippable properties.
        slotElement.edible = slot.edible!;
        slotElement.equippable = slot.equippable!;

        // Add the item stats and name
        slotElement.name = slot.name!;
        slotElement.count = slot.count!;
        slotElement.description = this.formatDescription(slot.name!, slot.count, slot.description!);
        slotElement.attackStats = slot.attackStats!;
        slotElement.defenseStats = slot.defenseStats!;
        slotElement.bonuses = slot.bonuses!;
    }

    /**
     * Creates a slot element using the DOM. The slot is
     * used when we want to add an item to the invnetory.
     * @returns A list element containing an empty slot.
     */

    private createSlot(index: number): HTMLLIElement {
        let slot = document.createElement('li'),
            item = document.createElement('div'),
            image = document.createElement('div'),
            count = document.createElement('div');

        item.dataset.index = `${index}`;

        // Assign the class to the slot and make it draggable.
        item.draggable = true;
        item.classList.add('item-slot');

        // Add the item image element onto the slot.
        image.classList.add('item-image');

        // Add the class element onto the count.
        count.classList.add('inventory-item-count');

        // Append the image onto the item slot.
        item.append(image);

        // Append the count onto the item slot.
        item.append(count);

        // Append the item onto the slot list element.
        slot.append(item);

        // Add the click event listeners to the slot.
        slot.addEventListener('click', () => this.select(index));
        slot.addEventListener('dblclick', () => this.select(index, true));
        slot.addEventListener('dragstart', (event) => this.dragStart(event, index));
        slot.addEventListener('drop', (event: DragEvent) => this.dragDrop(event, index));
        slot.addEventListener('dragover', (event: DragEvent) => this.dragOver(event));
        slot.addEventListener('dragleave', (event: DragEvent) => this.dragLeave(event));

        slot.addEventListener('touchstart', () => this.touchStart(index));
        slot.addEventListener('touchmove', (event) => this.touchMove(event, item));
        slot.addEventListener('touchcancel', () => this.touchCancel(item));
        slot.addEventListener('touchend', (event) => this.touchEnd(event, item));

        return slot;
    }

    /**
     * Sets the body's display style to `none` and
     * clears all the items from the bank user interface.
     */

    public override hide(): void {
        super.hide();

        // Reset the selected slot whenever the menu is hidden.
        this.selectedSlot = -1;

        this.actions.hide();
    }

    /**
     * Incldues the exact count in the description of an item. Applies for things like
     * gold, tokens, or large stackable items.
     * @param name The name of the item
     * @param count The count of the item
     * @param description The original description of the item.
     * @returns String containing the formatted description.
     */

    private formatDescription(name: string, count: number, description: string): string {
        return count < 1000
            ? description
            : `${description} You have a stack of ${count.toLocaleString(
                  'en-US'
              )} ${name.toLowerCase()}. `;
    }

    /**
     * Checks whether the specified element is empty by verifying its
     * background image property.
     * @param element SlotElement that we are checking.
     * @returns Whether or not the background image style is an empty string or not.
     */

    private isEmpty(element: SlotElement): boolean {
        let image: HTMLElement = element.querySelector('.item-image')!;

        return !image || image.style.backgroundImage === '';
    }

    /**
     * @returns Whether or not the actions menu has the drop dialog visible.
     */

    public isDropDialogVisible(): boolean {
        return this.actions.dropDialog.style.display === 'block';
    }

    /**
     * Grabs the `div` slot element within the `li` element.
     * @param index The index of the slot we are grabbing.
     * @returns An HTMLElement for the slot.
     */

    private getElement(index: number): SlotElement {
        return this.list.children[index].querySelector('div') as HTMLElement;
    }

    /**
     * Returns the number value of the count at a specified index.
     * @param index The index at which we are grabbing the count.
     * @returns The number value of the count or 0 if it is not found.
     */

    public getCount(index: number): number {
        return this.getElement(index)?.count || 0;
    }

    /**
     * Iterates through all the slots and grabs the first edible item
     * that appears in the inventory returning its index.
     * @returns The slot index of the first edible item or -1 if none are found.
     */

    private getFirstEdible(): number {
        for (let i = 0; i < this.list.children.length; i++) {
            let slot = this.getElement(i);

            if (slot.edible) return i;
        }

        return -1;
    }

    /**
     * Iterates through all the children of the inventory list
     * and returns the index and the element.
     * @param callback Contains the index and the slot HTML element.
     */

    public forEachSlot(callback: (index: number, slot: SlotElement) => void): void {
        for (let i = 0; i < this.list.children.length; i++) callback(i, this.getElement(i));
    }

    /**
     * Callback for when an item slot element is selected.
     * @param callback Contains the index of the slot selected.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
