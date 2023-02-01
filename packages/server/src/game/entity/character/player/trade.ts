import { Trade as TradePacket } from '../../../../network/packets';

import _ from 'lodash';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Opcodes } from '@kaetram/common/network';

import type Player from './player';
import type Item from '../../objects/item';

/**
 * The trade instance is used to handle trading between two players. Whenever a trade is initiated,
 * both players will have a trade instance created for them. Each trade instance gets updated according
 * to the player's/other player's actions. When trade action occur, the packets must be sent to
 * both parties.
 */

type OpenCallback = (instance: string) => void;
type AddCallback = (instance: string, index: number, count: number, key: string) => void;
type RemoveCallback = (instance: string, index: number) => void;
interface OfferedItem {
    inventoryIndex: number;
    item: Item;
}

export default class Trade {
    // The items that the player is offering to the other player (use the other player's `itemOffered` to get the items exchanged.)
    private itemsOffered: { [index: number]: OfferedItem | undefined } = {};

    public lastRequest = ''; // The last person who requested to trade with the player.
    public activeTrade?: Player | null; // The player who we are currently trading with.
    public accepted = false;

    public openCallback?: OpenCallback;
    public addCallback?: AddCallback;
    public removeCallback?: RemoveCallback;
    public acceptCallback?: OpenCallback; // Send the instance of who is accepting the trade.

    public constructor(private player: Player) {
        // Create an empty items offered container mock.
        for (let i = 0; i < this.player.inventory.size; i++) this.itemsOffered[i] = undefined;
    }

    /**
     * Takes an item from the inventory and stores it into the items up for offer. These items
     * are used by both instances to commence the trade of items. Visually the item is taken
     * from the inventory and added into the trade interface.
     * @param index The index in the inventory of the slot we selected.
     * @param count The amount of items we are offering to trade.
     */

    public add(index: number, count = -1): void {
        let offerIndex = this.getEmptySlot();

        if (offerIndex === -1)
            return this.player.notify(`You cannot add any more items to the trade.`, '', 'TRADE');

        // Grab the slot from the inventory.
        let slot = this.player.inventory.get(index);

        // Ensure the slot exists and is not empty.
        if (slot?.isEmpty()) return;

        // Create an item instance and make necessary changes to it.
        let item = this.player.inventory.getItem(slot);

        // Ensure the item exists.
        if (!item) return;

        // Undroppable items are special items that cannot be traded.
        if (item.undroppable) return this.player.notify(`You cannot trade this item.`, '', 'TRADE');

        // Sync the count of the item in the inventory with the count of the item in the trade.
        item.count = count === -1 ? slot.count : count;

        // Add the item to the items offered array.
        this.itemsOffered[offerIndex] = {
            inventoryIndex: index,
            item
        };

        // Any addition or removal of an item resets the trade acceptance.
        this.accepted = false;

        // Callbacks for both instances of the trade.
        this.addCallback?.(this.player.instance, offerIndex, item.count, item.key);
        this.getActiveTrade()?.addCallback?.(
            this.player.instance,
            offerIndex,
            item.count,
            item.key
        );
    }

    /**
     * Removes an item from the items offered array. This is then updated
     * to both instances of the trade. Visually it is added back to the inventory.
     * @param index The index in the itemsOffered array that we are removing.
     */

    public remove(index: number): void {
        this.itemsOffered[index] = undefined;

        // Any addition or removal of an item resets the trade acceptance.
        this.accepted = false;

        // Send the callback to both trade instances.
        this.removeCallback?.(this.player.instance, index);
        this.getActiveTrade()?.removeCallback?.(this.player.instance, index);
    }

    /**
     * Handles the accepting of trade and relaying to the other person that the
     * trade has been requested to be accepted. In order for a trade to be accepted,
     * both parties must accept the trade. If any item changes occur, then both
     * parties must accept the trade again.
     */

    public accept(): void {
        // If the other player has already accepted the trade, then we can do the exchange.
        if (this.getActiveTrade()?.accepted) {
            // Ensure both players have enough space in their inventories.
            if (
                this.player.inventory.getEmptySlots() <
                this.getActiveTrade()!.getTotalOfferedCount()
            ) {
                this.activeTrade?.notify(
                    `The other player does not have enough space in their inventory.`,
                    '',
                    'TRADE'
                );
                return this.player.notify(
                    `You do not have enough space in your inventory.`,
                    '',
                    'TRADE'
                );
            }

            // Start giving both players the items.
            this.forEachOfferedItem((inventoryIndex: number, item: Item) => {
                if (this.activeTrade!.inventory.add(item))
                    this.player.inventory.remove(inventoryIndex, item.count);
            });

            this.getActiveTrade()!.forEachOfferedItem((inventoryIndex: number, item: Item) => {
                if (this.player.inventory.add(item))
                    this.activeTrade!.inventory.remove(inventoryIndex, item.count);
            });

            // Notify both that the trade is complete.
            this.player.notify(`Thank you for using Kaetram trading system!`, '', 'TRADE');
            this.activeTrade?.notify(`Thank you for using Kaetram trading system!`, '', 'TRADE');

            return this.close();
        }

        // Relay to the client that one of the parties accepted the trade.
        this.acceptCallback?.(this.player.instance);
        this.getActiveTrade()?.acceptCallback?.(this.player.instance);

        // Set the trade to accepted.
        this.accepted = true;
    }

    /**
     * A request is when one of the player attempts to start a trade
     * with the other player. This prompts the other player with a notification.
     * If the other player also requests to trade, then we start a trade.
     * @param target The player who we are requesting to trade with.
     */

    public request(target: Player): void {
        // Player is too far away to start trading.
        if (this.player.getDistance(target) > 1) return;

        // Prevent cheaters from trading.
        if (this.player.isCheater())
            return this.player.notify('Sorry but cheaters are not allowed to trade.');

        if (target.isCheater())
            return this.player.notify('That player is a cheater, he might sell you contraband!');

        if (target.trade.lastRequest === this.player.instance) return this.open(target);

        this.lastRequest = target.instance;

        target.notify(
            `${Utils.formatName(this.player.username)} has requested to trade with you.`,
            'rgb(84, 224, 255)',
            'TRADE'
        );

        this.player.notify(
            `You have requested to trade with ${Utils.formatName(target.username)}.`,
            '',
            'TRADE'
        );
    }

    /**
     * Opens the trading interface for both players.
     * @param target The target player who we are trading with.
     */

    public open(target: Player): void {
        log.debug(`Opening trade between ${this.player.username} and ${target.username}.`);

        /**
         * Send the open packet to both players. Each player receives the other
         * player's instance as a parameter. As such, they are each-other's target.
         */

        this.openCallback?.(target.instance);
        target.trade.openCallback?.(this.player.instance);

        // Set the active trade for both players.
        this.player.trade.activeTrade = target;
        target.trade.activeTrade = this.player;

        // Remove the last request for both players.
        this.lastRequest = '';
        target.trade.lastRequest = '';
    }

    /**
     * Sends a close packet to both players.
     * @param target The other party taking part in the trade.
     */

    public close(): void {
        if (!this.activeTrade) return;

        log.debug(
            `Closing trade between ${this.player.username} and ${this.activeTrade?.username}.`
        );

        // Close the trade for the player.
        this.player.send(new TradePacket(Opcodes.Trade.Close, {}));

        // Close the trade for the other party if they are still trading.
        this.activeTrade?.send(new TradePacket(Opcodes.Trade.Close, {}));

        // Clear the active trade for both players.
        this.getActiveTrade()?.clear(); // Clear first so it's not undefined.
        this.clear();
    }

    /**
     * Clears the active trade for the player.
     */

    public clear(): void {
        this.activeTrade = null;
        this.accepted = false;

        // Clear the items offered array and set them back to undefined.
        for (let i in this.itemsOffered) this.itemsOffered[i] = undefined;
    }

    /**
     * Finds an empty slot in the array of items offered.
     * @returns The index of the empty slot, otherwise -1.
     */

    private getEmptySlot(): number {
        let index = -1;

        // Try to find an index that is empty.
        for (let i in this.itemsOffered) if (!this.itemsOffered[i]) return parseInt(i);

        return index;
    }

    /**
     * Checks the total amount of items offered in the trade.
     * @returns The total amount of items offered in the trade.
     */

    public getTotalOfferedCount(): number {
        let count = 0;

        for (let i in this.itemsOffered) if (this.itemsOffered[i]) count++;

        return count;
    }

    /**
     * @returns The currently active trade (the instance of the other player's trade.)
     */

    public getActiveTrade(): Trade | undefined {
        return this.activeTrade?.trade;
    }

    /**
     * Iterates through every offered item in the dictionary and returns the item and its
     * index in the inventory.
     * @param callback A valid existing item within the offered slots and its inventory index.
     */

    private forEachOfferedItem(callback: (inventoryIndex: number, item: Item) => void): void {
        _.each(this.itemsOffered, (offeredItem: OfferedItem | undefined) => {
            if (offeredItem?.item) callback(offeredItem.inventoryIndex, offeredItem.item);
        });
    }

    /**
     * Callback for when we want to open the trade interface.
     * @param callback Contains the instance of the other player.
     */

    public onOpen(callback: OpenCallback): void {
        this.openCallback = callback;
    }

    /**
     * Callback for when we want to add an item to the trade.
     * @param callback Contains the instance of who is adding the item and the slot data.
     */

    public onAdd(callback: AddCallback): void {
        this.addCallback = callback;
    }

    /**
     * Callback for when we want to remove an item from the trade.
     * @param callback Contains the instance of who is removing the item and the index.
     */

    public onRemove(callback: RemoveCallback): void {
        this.removeCallback = callback;
    }

    /**
     * Callback for when we want to accept the trade.
     * @param callback Contains the instance of who is accepting the trade.
     */

    public onAccept(callback: OpenCallback): void {
        this.acceptCallback = callback;
    }
}
