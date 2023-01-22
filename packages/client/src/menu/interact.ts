import Menu from './menu';

export default class Interact extends Menu {
    private closeCallback?: () => void;

    public constructor() {
        super('#interact');
    }

    /**
     * Override for the show function. Takes a position as a parameter.
     * @param position The mouse position (on the screen) where we will display the interact menu.
     */

    public override show(position: Position): void {
        super.show();

        console.log(
            `innerWidth: ${window.innerWidth}, innerHeight: ${window.innerHeight} position: ${position.x}, ${position.y}`
        );

        console.log(`container: ${this.container.offsetWidth}, ${this.container.offsetHeight}`);

        let x =
                position.x + this.container.offsetWidth > window.innerWidth
                    ? window.innerWidth - this.container.offsetWidth
                    : position.x,
            y =
                position.y + this.container.offsetHeight > window.innerHeight
                    ? window.innerHeight - this.container.offsetHeight
                    : position.y;

        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
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
