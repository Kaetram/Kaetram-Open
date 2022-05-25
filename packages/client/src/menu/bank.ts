import Menu from './menu';

export default class Bank extends Menu {
    private body: HTMLElement = document.querySelector('#bank')!;
    private slot: HTMLElement = document.querySelector('#bank-slot')!;
    private inventorySlots: HTMLElement = document.querySelector('#bank-inventory-slots')!;

    private close: HTMLElement = document.querySelector('#close-bank')!;

    public constructor() {
        super();

        this.close.addEventListener('click', () => this.hide());
    }

    public load(): void {
        //
    }

    /**
     * Displays the bank interface.
     */

    public override show(): void {
        this.body.style.display = 'block';
    }

    /**
     * Sets the body's display style to `none` and
     * clears all the items from the bank user interface.
     */

    public override hide(): void {
        this.body.style.display = 'none';
    }
}
