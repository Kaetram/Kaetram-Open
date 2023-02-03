/* eslint-disable @typescript-eslint/no-unused-vars */
import log from '../lib/log';
import Util from '../utils/util';

export default abstract class Menu {
    public hideOnShow = true;

    protected container: HTMLElement;
    protected close: HTMLElement;
    protected button: HTMLElement;

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
        this.container = document.querySelector(this.containerName!)!;
        this.close = document.querySelector(this.closeButton!)!;
        this.button = document.querySelector(this.toggleButton!)!;

        this.close?.addEventListener('click', this.hide.bind(this));
        this.button?.addEventListener('click', this.toggle.bind(this));
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

    public add(_data: unknown, _data1: unknown, _data2: unknown, data3: unknown): void {
        log.debug(`Unimplemented menu add() function.`);
    }

    /**
     * Called by subclasses when removing an item from slots.
     * @param _data Unknown data that may contain information to remove an item.
     */

    public remove(_data: unknown, _data1?: unknown): void {
        log.debug(`Unimplemented menu remove() function.`);
    }

    /**
     * Called by subclasses when we want to display the interface.
     * @param _var* Unknown data that may be passed when opening the menu subclass.
     */

    public show(
        _var1?: unknown,
        _var2?: unknown,
        _var3?: unknown,
        _var4?: unknown,
        _var5?: unknown
    ): void {
        this.showCallback?.();

        this.button?.classList.add('active');

        Util.fadeIn(this.container);
    }

    /**
     * Called by subclasses when we want to hide the interface.
     */

    public hide(): void {
        this.button?.classList.remove('active');

        Util.fadeOut(this.container);
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
     * Special call for when we are asking the menu
     * interface to resize. For example, say a notification
     * is displayed and the screen is resized, we may need
     * to call this function to the notification object to
     * update the `top` style position of the notification.
     */

    public resize(): void {
        //log.debug(`Unimplemented menu resize() function.`);
    }

    /**
     * @returns Whether or not the body is visible.
     */

    public isVisible(): boolean {
        return this.container.style.display === 'block';
    }

    /**
     * Creates a callback for when the interface is being shown.
     */

    public onShow(callback: () => void): void {
        this.showCallback = callback;
    }
}
