import Menu from './menu';

import Util from '../utils/util';

export default class Friends extends Menu {
    // List where we store all the friends.
    private list: HTMLUListElement = document.querySelector('#friends-container > ul')!;

    // Primary buttons (for adding and removing friends).
    private addButton: HTMLButtonElement = document.querySelector('#add-friend')!;
    private removeButton: HTMLButtonElement = document.querySelector('#remove-friend')!;

    // Popup-related input and buttons.
    private addInput: HTMLInputElement = document.querySelector('#add-friend-input')!;
    private addConfirm: HTMLButtonElement = document.querySelector('#add-friend-confirm')!;
    private addCancel: HTMLButtonElement = document.querySelector('#add-friend-cancel')!;

    // Popup element
    private popup: HTMLDivElement = document.querySelector('#popup-container')!;

    public constructor() {
        super('#friends-page', undefined, '#friends-button');

        this.addButton.addEventListener('click', () => Util.fadeIn(this.popup));

        this.addCancel.addEventListener('click', () => Util.fadeOut(this.popup));
    }
}
