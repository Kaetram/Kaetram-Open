import Menu from './menu';

export default class Trade extends Menu {
    private closeCallback?: () => void;

    public constructor() {
        super('#trade', undefined, '#close-trade');
    }

    /**
     * Called when the player closes the trade menu.
     * @param ignoreCallback Whether or not to ignore the close callback.
     */

    public override hide(ignoreCallback = false): void {
        super.hide();

        if (!ignoreCallback) this.closeCallback?.();
    }

    /**
     * Callback for when the player closes the trade menu.
     */

    public onClose(callback: () => void): void {
        this.closeCallback = callback;
    }
}
