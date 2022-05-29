import Menu from './menu';

export default class Bank extends Menu {
    protected override body: HTMLElement = document.querySelector('#bank')!;
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
}
