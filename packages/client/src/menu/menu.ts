/* eslint-disable @typescript-eslint/no-unused-vars */
import log from '../lib/log';

export default abstract class Menu {
    protected body: HTMLElement = document.querySelector(this.containerName!)!;
    protected close: HTMLElement = document.querySelector(this.closeButton!)!;
    protected button: HTMLElement = document.querySelector(this.toggleButton!)!;

    // Callback sent to the controller to close other menus.
    private showCallback?: () => void;

    /**
     * Initializes the menu container using the provided container name string.
     * This one is used to load the body of the interface.
     * @param containerName Optional string name passed to the constructor that is
     * used to load the body of the interface using the querySelector. If this is not
     * provided, it is then expected that the body is overrided and loaded in the subclass.
     * @param closeButton Optional parameter passed when we want to load a close button
     * into the interface and load its respective event listener. This is automatically
     * linked to the hide() function.
     * @param toggleButton Optional string parameter for the toggle button. These are buttons
     * that are displayed in the bottom right corner of the screen and are used to open and
     * close the user interface.
     */

    public constructor(
        private containerName?: string,
        private closeButton?: string,
        private toggleButton?: string
    ) {
        this.close?.addEventListener('click', () => this.hide());
        this.button?.addEventListener('click', () => this.toggle());
    }

    /**
     * Called by subclasses when attempting to load batch
     * serialized data from the server.
     * @param _data Can contain array of slots to load.
     */

    public batch(_data: unknown): void {
        log.debug(`Unimplemented menu batch() function.`);
    }

    /**
     * Used to synchronize data betwene the inventory and the UI.
     * @param _var1 Optional unknown data that may be passed along.
     */

    public synchronize(_var1?: unknown): void {
        //log.debug(`Unimplemented menu synchronize() function.`);
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
        this.showCallback?.();

        this.body.style.display = 'block';
        this.button?.classList.add('active');
    }

    /**
     * Called by subclasses when we want to hide the interface.
     */

    public hide(): void {
        this.body.style.display = 'none';

        this.button?.classList.remove('active');
    }

    /**
     * Toggles the visible of the main body element.
     * If the UI is visible, it hides it, if it's
     * not visible, then we display it.
     */

    public toggle(): void {
        if (this.isVisible()) this.hide();
        else this.show();
    }

    /**
     * @returns Whether or not the body is visible.
     */

    public isVisible(): boolean {
        return this.body.style.display === 'block';
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

    /**
     * Creates a callback for when the interface is being shown.
     */

    public onShow(callback: () => void): void {
        this.showCallback = callback;
    }
}
