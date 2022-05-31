import _ from 'lodash';

import Menu from './menu';

import log from '../lib/log';
import Util from '../utils/util';
import Actions from './actions';

import { Opcodes, Modules } from '@kaetram/common/network';
import { SlotData } from '@kaetram/common/types/slot';

type SelectCallback = (index: number, action: Opcodes.Container, tIndex?: number) => void;

interface SlotElement extends HTMLElement {
    edible?: boolean;
    equippable?: boolean;
}

export default class Inventory extends Menu {
    private list: HTMLUListElement = document.querySelector('#inventory > ul')!;

    // Button that opens the invnetory.
    private button: HTMLElement = document.querySelector('#inventory-button')!;

    // Used for when we open the action menu interface.
    private selectedSlot = -1;

    private selectCallback?: SelectCallback;

    public constructor(private actions: Actions) {
        super('#inventory');

        this.load();

        this.actions.onButton((action: Modules.MenuActions) => this.handleAction(action));
        this.button.addEventListener('click', () => this.toggle());
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
     * Creates a select callback using the action parameter specified.
     * @param action Which type of action is being performed.
     */

    private handleAction(action: Modules.MenuActions): void {
        this.selectCallback?.(this.selectedSlot, Util.getContainerAction(action));

        this.actions.hide();
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

            this.setSlot(slot.index, slot.key, slot.count, slot.edible, slot.equippable);
        });
    }

    /**
     * Uses the slot's index to add an item into our inventory UI.
     * @param slot Contains data about the item we are adding.
     */

    public override add(slot: SlotData): void {
        this.setSlot(slot.index, slot.key, slot.count, slot.edible, slot.equippable);
    }

    /**
     * Removes an item from our inventory and resets the slot to
     * its default state.
     * @param slot Contains index of the slot we are removing.
     */

    public override remove(slot: SlotData): void {
        this.setSlot(slot.index, slot.key, slot.count, slot.edible, slot.equippable);
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
        actions.push(Modules.MenuActions.Drop);

        let position = this.getPosition(element);

        this.actions.show(actions, position.x, position.y);
    }

    /**
     * Event handler for when a slot begins the dragging and dropping
     * process. We udate the current index of the slot that is being
     * selected for later use.
     * @param index The index of the slot being dragged.
     */

    private dragStart(index: number): void {
        if (this.isEmpty(this.getElement(index))) return;

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
     * Sets the slot's image and count at a specified index. If no key is provided
     * then we remove the slot's `backgroundImage` property and set the count to
     * an empty string.
     * @param index Index at which we are updating the slot data.
     * @param key Optional parameter that is used to get the image for the slot.
     * @param count Integer value to assign to the slot.
     * @param edible Boolean value that determines if the item in the slot is edible.
     * @param equippable Boolean value that determines if the item in the slot is equippable.
     */

    private setSlot(index: number, key = '', count = 1, edible = false, equippable = false): void {
        let slotElement = this.getElement(index);

        if (!slotElement) return log.error(`Could not find slot element at: ${index}`);

        let countElement = slotElement.querySelector('.inventory-item-count');

        if (countElement) countElement.textContent = Util.getCount(count);

        slotElement.style.backgroundImage = key ? Util.getImageURL(key) : '';

        // Update the edible and equippable properties.
        slotElement.edible = edible;
        slotElement.equippable = equippable;
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

        // Assign the class to the slot and make it draggable.
        item.draggable = true;
        item.classList.add('item-slot');

        // Add the class element onto the count.
        count.classList.add('inventory-item-count');

        // Append the count onto the item slot.
        item.append(count);

        // Append the item onto the slot list element.
        slot.append(item);

        // Add the click event listeners to the slot.
        slot.addEventListener('click', () => this.select(index));
        slot.addEventListener('dblclick', () => this.select(index, true));
        slot.addEventListener('dragstart', () => this.dragStart(index));
        slot.addEventListener('drop', (event: DragEvent) => this.dragDrop(event, index));
        slot.addEventListener('dragover', (event: DragEvent) => this.dragOver(event));
        slot.addEventListener('dragleave', (event: DragEvent) => this.dragLeave(event));

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
        super.show();

        this.button.classList.add('active');
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
        this.button.classList.remove('active');
    }

    /**
     * Checks whether the specified element is empty by verifying its
     * background image property.
     * @param element SlotElement that we are checking.
     * @returns Whether or not the background image style is an empty string or not.
     */

    private isEmpty(element: SlotElement): boolean {
        return element.style.backgroundImage === '';
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
     * Retrieves the absolute position of an element
     * relative to the screen.
     * @param element The element we are extracting position of.
     * @returns A position object containing the x and y coordinates.
     */

    private getPosition(element: HTMLElement): Position {
        let boundingRect = element.getBoundingClientRect();

        return {
            x: boundingRect.left - boundingRect.width,
            y: boundingRect.top - boundingRect.height * 2
        };
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
