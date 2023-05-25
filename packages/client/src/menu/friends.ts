import Menu from './menu';

import Util from '../utils/util';
import { isLargeScreen } from '../utils/detect';

import { Opcodes } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';

type ConfirmCallback = (username: string, remove?: boolean) => void;

export default class Friends extends Menu {
    private page: HTMLDivElement = document.querySelector('#friends-page')!;

    // List where we store all the friends.
    private list: HTMLUListElement = document.querySelector('#friends-page > ul')!;

    // Primary buttons (for adding and removing friends).
    private addButton: HTMLButtonElement = document.querySelector('#add-friend')!;
    private removeButton: HTMLButtonElement = document.querySelector('#remove-friend')!;

    // Popup-related input and buttons.
    private input: HTMLInputElement = document.querySelector('#popup-friend-input')!;
    private confirm: HTMLButtonElement = document.querySelector('#popup-friend-confirm')!;
    private cancel: HTMLButtonElement = document.querySelector('#popup-friend-cancel')!;

    // Popup element
    private popup: HTMLDivElement = document.querySelector('#popup-container')!;

    // Callbacks
    private confirmCallback?: ConfirmCallback;
    private messageCallback?: (username: string) => void;

    // Booleans
    private popupActive = false;
    private removeActive = false;

    public constructor(private player: Player) {
        super('#friends-container', undefined, '#friends-button');

        this.addButton.addEventListener('click', () => this.showPopup());
        this.removeButton.addEventListener('click', () => this.showPopup(true));

        this.confirm.addEventListener('click', this.handleConfirm.bind(this));
        this.cancel.addEventListener('click', this.hidePopup.bind(this));
    }

    public override resize(): void {
        for (let key in this.player.friends) {
            let friend = this.player.friends[key],
                element = this.list.children[friend.id];

            if (!element) return;

            let name = element.children[0] as HTMLElement,
                maxLength = this.getMaxLength();

            if (friend.username.length > maxLength)
                name.innerHTML = `${friend.username.slice(0, maxLength)}...`;
        }
    }

    /**
     * Function is called whenever we receive the initial friend list or subsequent
     * updates from the server regarding adding, removing, or status changes.
     * @param opcode The type of action we are handling.
     * @param username (Only for add/remove/update) The username of the friend we are handling.
     * @param status (Only for add/update) The world that the friend is in.
     */

    public handle(opcode: Opcodes.Friends, username = '', status = false, serverId = -1): void {
        switch (opcode) {
            case Opcodes.Friends.List: {
                for (let friend of Object.values(this.player.friends))
                    this.createElement(friend.username, friend.online, friend.serverId);

                break;
            }

            case Opcodes.Friends.Add: {
                return this.createElement(username, status, serverId);
            }

            case Opcodes.Friends.Remove: {
                return this.removeElement(username);
            }

            case Opcodes.Friends.Status: {
                return this.updateStatus(username, status, serverId);
            }
        }
    }

    /**
     * Uses the input field to add a friend and sends a packet to the server.
     */

    private handleConfirm(): void {
        let username = this.input.value,
            remove = this.removeActive; // Before we clear its status.

        // Clear the input field.
        this.input.value = '';

        // Hide the popup.
        this.hidePopup();

        // Client-sided sanitization for the input field.
        if (!username || username.length > 32) return;

        // Send the packet to the server.
        this.confirmCallback?.(username, remove);
    }

    /**
     * Event handler for when the user clicks on a friend's name.
     */

    private handleMessage(username: string): void {
        if (!this.player.friends[username].online) return;

        this.messageCallback?.(username);
    }

    /**
     * Handles the keydown event for the friends menu.
     * @param key The key that was pressed.
     */

    public keyDown(key: string): void {
        if (key === 'Escape') this.hidePopup();
        if (key === 'Enter' && this.input.value !== '') this.handleConfirm();
    }

    /**
     * Show the popup and dim the background.
     */

    private showPopup(remove = false): void {
        this.popupActive = true;
        this.removeActive = remove;

        this.input.placeholder = remove ? 'Enter name to remove...' : 'Enter name to add...';

        Util.fadeIn(this.popup);

        this.page.classList.add('dimmed');

        this.input.focus();
    }

    /**
     * Hide the popup and remove the dim from the background.
     */

    private hidePopup(): void {
        this.popupActive = false;
        this.removeActive = false;

        Util.fadeOut(this.popup);

        this.page.classList.remove('dimmed');
    }

    /**
     * Creates a mew HTML element for the friend slot.
     * @param username The username of the friend.
     */

    private createElement(username: string, online = false, serverId = -1): void {
        let element = document.createElement('li'),
            name = document.createElement('p'),
            world = document.createElement('p');

        // Add styling to the friend slot element.
        element.classList.add('container-slot');

        // Add styling to the friend name element.
        name.classList.add('stroke', 'left');

        // Add styling to the world element.
        world.classList.add('stroke', 'right');

        // If the friend is online, add the online class (makes the username green).
        if (online) world.classList.add(this.player.serverId === serverId ? 'green' : 'yellow');

        // Set the name of the friend.
        let maxLength = this.getMaxLength();

        if (username.length > maxLength) username = `${username.slice(0, maxLength)}...`;

        name.innerHTML = Util.formatName(username);

        // Update the world information.
        world.innerHTML = online ? `World ${serverId}` : 'Offline';

        // Add the name element to the friend slot element.
        element.append(name, world);

        // Add the friend slot element to the friend list.
        this.list.append(element);

        element.addEventListener('click', () => this.handleMessage(username));
    }

    /**
     * Grabs the friend from the list of friends and removes the element from the DOM.
     * @param username The username of the player we are removing.
     */

    private removeElement(username: string): void {
        let friend = this.player.friends[username];

        // No friend has been found.
        if (!friend) return;

        // Remove the friend from the UI list.
        this.list.children[friend.id].remove();

        // Remove the friend from the player's friend list.
        delete this.player.friends[username];
    }

    /**
     * Grabs the friend from the list of friends and updates the status.
     * @param username Username of the friend we are updating.
     * @param online The online status of the friend.
     * @param serverId The world id that the friend is on.
     */

    private updateStatus(username: string, online: boolean, serverId: number): void {
        let friend = this.player.friends[username];

        // No friend has been found.
        if (!friend) return;

        // Grab the friend's name element.
        let world = this.list.children[friend.id].children[1] as HTMLParagraphElement;

        // If the friend is online, add the online class (makes the username green).
        if (online) {
            world.classList.add(this.player.serverId === serverId ? 'green' : 'yellow');
            world.innerHTML = `World ${friend.serverId}`;
        } else {
            world.classList.remove('green', 'yellow');
            world.innerHTML = 'Offline';
        }
    }

    /**
     * @returns Whether or not the popup is visible.
     */

    public isPopupActive(): boolean {
        return this.popupActive;
    }

    /**
     * Large devices can fit more text so we truncate less of the username string.
     * @returns The maximum length of the username based on the screen size.
     */

    private getMaxLength(): number {
        return isLargeScreen() ? 16 : 10;
    }

    /**
     * Confirm callback is called whenever the player presses the confirm button.
     * @param callback Contains the username and the type of action (add/remove).
     */

    public onConfirm(callback: ConfirmCallback): void {
        this.confirmCallback = callback;
    }

    /**
     * Event handler for when a friend is clicked. Their username is passed to
     * chat handler.
     * @param callback Contains username of the friend.
     */

    public onMessage(callback: (username: string) => void): void {
        this.messageCallback = callback;
    }
}
