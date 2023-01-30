import Menu from './menu';

import Util from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type Inventory from './inventory';
import type Player from '../entity/character/player/player';

type SelectCallback = (type: Modules.ContainerType, index: number) => void;
export default class Trade extends Menu {
    public override hideOnShow = false;

    private inventoryList: HTMLUListElement = document.querySelector(
        '#trade-inventory-slots > ul'
    )!;

    private playerName: HTMLElement = document.querySelector('#trade-player-name')!;
    private otherPlayerName: HTMLElement = document.querySelector('#trade-oplayer-name')!;

    private selectCallback?: SelectCallback;
    private closeCallback?: () => void;

    public constructor(private inventory: Inventory) {
        super('#trade', undefined, '#close-trade');

        this.load();
    }

    /**
     * Loads the empty inventory slots based on the size of the inventory.
     * Creates an event listener for each slot that direts to `select()`.
     */

    public load(): void {
        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++)
            this.inventoryList.append(
                Util.createSlot(Modules.ContainerType.Inventory, i, this.select.bind(this))
            );
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
    }

    /**
     * Initializes the selection process. A callback is created so that
     * the menu controller can send specified request to the server.
     * @param type Which container is being acted on (inventory or bank).
     * @param index The index of the item being acted on.
     */

    private select(type: Modules.ContainerType, index: number): void {
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
     * Callback used for whenever a slot is selected. This is used
     * by an external controller in order to make requests to the server.
     * @param callback Contains the type of container that is
     * being clicked, as well as the index of the slot.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }

    /**
     * Callback for when the player closes the trade menu.
     */

    public onClose(callback: () => void): void {
        this.closeCallback = callback;
    }
}
