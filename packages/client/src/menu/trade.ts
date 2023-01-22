import Menu from './menu';

export default class Trade extends Menu {
    private closeCallback?: () => void;

    public constructor() {
        super('#trade', undefined, '#close-trade');
    }

    /**
     * Called when the player closes the trade menu.
     */

    public override hide(): void {
        super.hide();

        this.closeCallback?.();
    }

    /**
     * Callback for when the player closes the trade menu.
     */

    public onClose(callback: () => void): void {
        this.closeCallback = callback;
    }
}
