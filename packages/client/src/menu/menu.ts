/* eslint-disable @typescript-eslint/no-unused-vars */
import log from '../lib/log';

export default abstract class Menu {
    protected body!: HTMLElement;

    /**
     * Called by subclasses when attempting to load batch
     * serialized data from the server.
     * @param _data Can contain array of slots to load.
     */

    public batch(_data: unknown): void {
        log.debug(`Unimplemented menu batch() function.`);
    }

    /**
     * Called by subclasses when attempting to add an element.
     * @param _data Unknown data that may contain information about an item.
     */

    public add(_data: unknown): void {
        log.debug(`Unimplemented menu add() function.`);
    }

    /**
     * Called by subclasses when removing an item from slots.
     * @param _data Unknown data that may contain information to remove an item.
     */

    public remove(_data: unknown): void {
        log.debug(`Unimplemented menu remove() function.`);
    }

    /**
     * Called by subclasses when we want to display the interface.
     * @param _var1 Unknown data that may be passed when opening the menu subclass.
     * @param _var2 Unknown data that may be passed when opening the menu subclass.
     * @param var3 Unknown data that may be passed when opening the menu subclass.
     */

    public show(_var1?: unknown, _var2?: unknown, var3?: unknown): void {
        this.body.style.display = 'block';
    }

    /**
     * Called by subclasses when we want to hide the interface.
     */

    public hide(): void {
        this.body.style.display = 'none';
    }

    /**
     * Superclass implementation to be used throughout all the subclasses
     * when wanting to create a slot element. This slot can be used in the
     * bank or inventory, and throughout things such as bank, enchant, and
     * store interfaces.
     * @param name The name prefix of the element (i.e. 'bank').
     * @param index Index of the slot we are creating (for identification).
     */

    protected createElement(name: string, index: number): HTMLElement {
        let listElement = document.createElement('li'),
            slot = document.createElement('div'),
            image = document.createElement('div'),
            count = document.createElement('div');

        // Sets the class and id of the bank slot.
        slot.id = `${name}-slot${index}`;
        slot.classList.add('bank-slot');

        // Sets the class and id of the image.
        image.id = `${name}-image${index}`;
        image.classList.add('bank-image');

        // Sets the class and id of the count.
        count.id = `${name}-count${index}`;
        count.classList.add('item-count');

        // Appends image and count onto the bank slot.
        slot.append(image);
        slot.append(count);

        // Appends the bank slot onto the list element.
        listElement.append(slot);

        return listElement;
    }

    /**
     * UI scaling determines which size of assets to use depending
     * on the screen size. It also adjusts the CSS accordingly.
     * @returns UI scale from 1 to 3.
     */

    public getUIScale(): number {
        let width = window.innerWidth,
            height = window.innerHeight;

        return width <= 1000 ? 1 : width <= 1500 || height <= 870 ? 2 : 3;
    }
}
