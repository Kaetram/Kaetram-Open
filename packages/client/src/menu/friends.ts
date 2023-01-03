import _ from 'lodash';
import { Opcodes } from '@kaetram/common/network';

import Util from '../utils/util';

import Menu from './menu';

import type Player from '../entity/character/player/player';
import type Friend from '../entity/character/player/friend';

type ConfirmCallback = (username: string, remove?: boolean) => void;

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

    // Callbacks
    private confirmCallback?: ConfirmCallback;

    public constructor(private player: Player) {
        super('#friends-page', undefined, '#friends-button');

        this.addButton.addEventListener('click', this.showPopup.bind(this));

        this.addConfirm.addEventListener('click', this.addFriend.bind(this));
        this.addCancel.addEventListener('click', this.hidePopup.bind(this));
    }

    /**
     * Function is called whenever we receive the initial friend list or subsequent
     * updates from the server regarding adding, removing, or status changes.
     * @param opcode The type of action we are handling.
     * @param username (Only for add/remove/update) The username of the friend we are handling.
     */

    public handle(opcode: Opcodes.Friends, username = ''): void {
        switch (opcode) {
            case Opcodes.Friends.List: {
                _.each(this.player.friends, (friend: Friend) =>
                    this.createElement(friend.username)
                );
                break;
            }

            case Opcodes.Friends.Add: {
                return this.createElement(username);
            }
        }
    }

    /**
     * Show the popup and dim the background.
     */

    private showPopup(): void {
        this.player.popup = true;

        Util.fadeIn(this.popup);

        document.querySelector('#friends-container')?.classList.add('dimmed');

        this.addInput.focus();
    }

    /**
     * Hide the popup and remove the dim from the background.
     */

    private hidePopup(): void {
        this.player.popup = false;

        Util.fadeOut(this.popup);

        document.querySelector('#friends-container')?.classList.remove('dimmed');
    }

    /**
     * Uses the input field to add a friend and sends a packet to the server.
     */

    private addFriend(): void {
        let username = this.addInput.value;

        // Clear the input field.
        this.addInput.value = '';

        // Hide the popup.
        this.hidePopup();

        // Client-sided sanitization for the input field.
        if (!username || username.length > 32) return;

        // Send the packet to the server.
        this.confirmCallback?.(username);
    }

    /**
     * Creates a mew HTML element for the friend slot.
     * @param username The username of the friend.
     */

    private createElement(username: string): void {
        let element = document.createElement('li'),
            name = document.createElement('p');

        // Add styling to the friend slot element.
        element.classList.add('friend-slot');

        // Add styling to the friend name element.
        name.classList.add('stroke');

        // Set the name of the friend.
        name.innerHTML = username;

        // Add the name element to the friend slot element.
        element.append(name);

        // Add the friend slot element to the friend list.
        this.list.append(element);
    }

    /**
     * Confirm callback is called whenever the player presses the confirm button.
     * @param callback Contains the username and the type of action (add/remove).
     */

    public onConfirm(callback: ConfirmCallback): void {
        this.confirmCallback = callback;
    }
}
