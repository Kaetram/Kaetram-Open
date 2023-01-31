import Menu from './menu';

import Util from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type Inventory from './inventory';
import type Player from '../entity/character/player/player';

interface PlayerSlot extends HTMLElement {
    inventoryIndex?: number;
}

type SelectCallback = (type: Modules.ContainerType, index: number) => void;
export default class Trade extends Menu {
    public override hideOnShow = false;

    private inventoryList: HTMLUListElement = document.querySelector(
        '#trade-inventory-slots > ul'
    )!;

    // Where we visually display the changes to the trade.
    private playerSlots: HTMLUListElement = document.querySelector('#trade-player-slots > ul')!;
    private otherPlayerSlots: HTMLUListElement = document.querySelector(
        '#trade-oplayer-slots > ul'
    )!;

    private playerName: HTMLElement = document.querySelector('#trade-player-name')!;
    private otherPlayerName: HTMLElement = document.querySelector('#trade-oplayer-name')!;
    private tradeStatus: HTMLElement = document.querySelector('#trade-status')!;

    private acceptButton: HTMLButtonElement = document.querySelector('#trade-accept')!;

    private inventoryIndex = -1; // Index of the inventory slot that was last selected.
    private totalItems = 0; // Total items that are in the trade

    private selectCallback?: SelectCallback;
    private acceptCallback?: () => void;
    private closeCallback?: () => void;

    public constructor(private inventory: Inventory) {
        super('#trade', undefined, '#close-trade');

        this.load();

        // Send the accept callback when the accept button is clicked.
        this.acceptButton.addEventListener('click', () => this.acceptCallback?.());
    }

    /**
     * Loads the empty inventory slots based on the size of the inventory.
     * Creates an event listener for each slot that direts to `select()`.
     */

    public load(): void {
        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++) {
            // Inventory slots
            this.inventoryList.append(
                Util.createSlot(Modules.ContainerType.Inventory, i, this.select.bind(this))
            );

            // Player slots
            this.playerSlots.append(
                Util.createSlot(Modules.ContainerType.Trade, i, this.select.bind(this))
            );

            // Other player slots
            this.otherPlayerSlots.append(Util.createSlot(Modules.ContainerType.Trade, i));
        }
    }

    /**
     * Synchronizes the slot data between the store and the inventory.
     */

    public override synchronize(): void {
        if (!this.isVisible()) return;

        this.inventory.forEachSlot((index: number, slot: HTMLElement) => {
            let image = this.getElement(index).querySelector<HTMLElement>('.item-image')!,
                count = this.getElement(index).querySelector<HTMLElement>('.inventory-item-count')!,
                slotImage = slot.querySelector<HTMLElement>('.item-image')!;

            if (!slotImage) return;

            image.style.backgroundImage = slotImage.style.backgroundImage;
            count.textContent = slot.textContent;
        });
    }

    /**
     * Override for the show method where we use information from the two players
     * participating in the trading action to update the user interface.
     * @param player The primary player (from our perspective) who is trading.
     * @param otherPlayer The other player. For the other player, our player is the other player.
     */

    public override show(player: Player, otherPlayer: Player): void {
        super.show();

        this.synchronize();

        // Update the player names
        this.playerName.textContent = player.name;
        this.otherPlayerName.textContent = otherPlayer.name;
    }

    /**
     * Called when the player closes the trade menu.
     * @param ignoreCallback Whether or not to ignore the close callback.
     */

    public override hide(ignoreCallback = false): void {
        super.hide();

        if (!ignoreCallback) this.closeCallback?.();

        this.clearAll();

        this.inventoryIndex = -1;
        this.totalItems = 0;
        this.tradeStatus.innerHTML = '';
    }

    /**
     * Adds an item to the trade menu.
     * @param index The index of the item being added (if it is the current player adding the item).
     * @param count The amount of the item being added.
     * @param key The key of the item being added (if we are adding item of other player).
     */

    public override add(index: number, count: number, key: string, otherPlayer = false): void {
        let slot = otherPlayer
                ? this.otherPlayerSlots.children[index]
                : this.playerSlots.children[index],
            image = slot.querySelector<HTMLElement>('.item-image')!,
            slotCount = slot.querySelector<HTMLElement>('.inventory-item-count')!;

        // Update the icon of the item that is being added.
        image.style.backgroundImage = otherPlayer
            ? Util.getImageURL(key)
            : this.getElementImage(this.inventoryIndex);

        // Update the count of the item that is being added.
        slotCount.innerHTML = count > 1 ? count.toString() : '';

        if (!otherPlayer) {
            // Remove the item from the inventory.
            this.clearSlot(this.inventoryIndex);

            // Store the inventory slot into the trade slot if it is the current player adding the item.
            (slot as PlayerSlot).inventoryIndex = this.inventoryIndex;
        }

        this.totalItems++;
        this.tradeStatus.innerHTML = '';

        this.updateAcceptButton();
    }

    /**
     * Remove an item from the trade menu.
     * @param index The index of the slot to remove the item from.
     * @param otherPlayer Whether we are removing from the other player's trade menu.
     */

    public override remove(index: number, otherPlayer = false): void {
        let slot = otherPlayer
                ? this.otherPlayerSlots.children[index]
                : this.playerSlots.children[index],
            image = slot.querySelector<HTMLElement>('.item-image')!,
            slotCount = slot.querySelector<HTMLElement>('.inventory-item-count')!;

        // Add the item back into the inventory.
        if (!otherPlayer)
            this.setSlot(
                (slot as PlayerSlot).inventoryIndex!,
                image.style.backgroundImage,
                slotCount.innerHTML
            );

        // Clear the image and count of the slot.
        image.style.backgroundImage = '';
        slotCount.innerHTML = '';

        this.totalItems--;
        this.tradeStatus.innerHTML = '';

        this.updateAcceptButton();
    }

    /**
     * Visually updates the text information in the trade for when the current player
     * or the other player has put in a request to accept the trade.
     */

    public accept(otherPlayer = false): void {
        let text = otherPlayer
            ? 'The other player has accepted the trade.'
            : 'You have accepted the trade.';

        this.tradeStatus.innerHTML = text;
    }

    /**
     * Initializes the selection process. A callback is created so that
     * the menu controller can send specified request to the server.
     * @param type Which container is being acted on (inventory or bank).
     * @param index The index of the item being acted on.
     */

    private select(type: Modules.ContainerType, index: number): void {
        this.inventoryIndex = index;

        this.selectCallback?.(type, index);
    }

    /**
     * Grabs the HTMLElement at a specified index within the
     * inventory slot list.
     * @param index The index of the element to grab.
     * @returns The HTMLElement at the specified index.
     */

    private getElement(index: number): HTMLElement {
        return this.inventoryList.children[index].querySelector('div') as HTMLElement;
    }

    /**
     * Grabs the item image of a specified slot.
     * @param index The index of the slot to grab the image from.
     * @returns The string of the css `backgroundImage` property.
     */

    private getElementImage(index: number): string {
        let slot = this.getElement(index),
            image = slot.querySelector<HTMLElement>('.item-image')!;

        return image.style.backgroundImage;
    }

    /**
     * Updates the disabled status of the accept button depending on how many items there are.
     */

    private updateAcceptButton(): void {
        if (this.totalItems > 0) this.acceptButton.classList.remove('disabled');
        else this.acceptButton.classList.add('disabled');
    }

    /**
     * Clears a slot of the inventory at a specified index.
     * @param index The slot in the inventory that we are clearing.
     */

    private clearSlot(index: number): void {
        let slot = this.getElement(index),
            image = slot.querySelector<HTMLElement>('.item-image')!,
            count = slot.querySelector<HTMLElement>('.inventory-item-count')!;

        image.style.backgroundImage = '';
        count.innerHTML = '';
    }

    /**
     * Clears both the player's slots and the other player's slots of any images
     * or item counts that were previously set. This occurs when the trade is finalized.
     */

    private clearAll(): void {
        // Clear the player's slots.
        for (let i of this.playerSlots.children) {
            let image = i.querySelector<HTMLElement>('.item-image')!,
                count = i.querySelector<HTMLElement>('.inventory-item-count')!;

            image.style.backgroundImage = '';
            count.innerHTML = '';
        }

        // Clear the other player's slots.
        for (let i of this.otherPlayerSlots.children) {
            let image = i.querySelector<HTMLElement>('.item-image')!,
                count = i.querySelector<HTMLElement>('.inventory-item-count')!;

            image.style.backgroundImage = '';
            count.innerHTML = '';
        }
    }

    /**
     * Sets the image slot and count at a specified index.
     * @param index The index we are setting the slot at.
     * @param image The image background url that we are setting.
     * @param count The count of the item that we are setting.
     */

    private setSlot(index: number, image: string, count: string): void {
        let slot = this.getElement(index),
            slotImage = slot.querySelector<HTMLElement>('.item-image')!,
            slotCount = slot.querySelector<HTMLElement>('.inventory-item-count')!;

        slotImage.style.backgroundImage = image;
        slotCount.innerHTML = count;
    }

    /**
     * Callback used for whenever a slot is selected. This is used
     * by an external controller in order to make requests to the server.
     * @param callback Contains the type of container that is
     * being clicked, as well as the index of the slot.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }

    /**
     * Callback for when the player clicks the accept button.
     */

    public onAccept(callback: () => void): void {
        this.acceptCallback = callback;
    }

    /**
     * Callback for when the player closes the trade menu.
     */

    public onClose(callback: () => void): void {
        this.closeCallback = callback;
    }
}
