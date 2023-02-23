import { Trade as TradePacket } from '../../../../network/packets';

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
type AcceptCallback = (message?: string) => void;
interface OfferedItem {
    inventoryIndex: number;
    maxCount: number; // The amount of the item in the inventory slot.
    item: Item;
}

export default class Trade {
    // The items that the player is offering to the other player (use the other player's `itemOffered` to get the items exchanged.)
    private itemsOffered: { [index: number]: OfferedItem | undefined } = {};

    public lastRequest = ''; // The last person who requested to trade with the player.
    public activeTrade?: Player | null; // The player who we are currently trading with.
    public accepted = false;
    public inProgress = false; // Extra safety to prevent duplicate trades.

    public openCallback?: OpenCallback;
    public addCallback?: AddCallback;
    public removeCallback?: RemoveCallback;
    public acceptCallback?: AcceptCallback; // Send the instance of who is accepting the trade.

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

    public add(index: number, count = 1): void {
        // An item is deemed added when all of its counts have been offered.
        if (this.isAdded(index)) return;

        // In case of client-side packet manipulation.
        if (isNaN(count) || count < 1) return;

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

        // Handle existing items in the trade.
        let existingIndex = this.hasItem(slot.key);

        /**
         * Used for handling either existing items or new items. If the item doesn't exist
         * already in the offers, then we just proceed and update the count. If the item
         * does, we need to increment existing count of the offer.
         */

        if (existingIndex === -1) item.count = count > slot.count ? slot.count : count;
        else {
            /**
             * We're basically adding onto the existing slot. If the amount of items surpasses
             * that of the slot, then we set the amount to the max amount of the slot. Otherwise,
             * we just append onto existing amount.
             */

            let offer = this.itemsOffered[existingIndex]!;

            /**
             * We essentially update the new item count with the information about
             * the existing item in the offer. Then we just overwrite that whole
             * index in the `itemsOffered` dictionary.
             */

            if (offer.inventoryIndex === index && item.stackable)
                item.count =
                    offer.item.count + count > offer.maxCount
                        ? offer.maxCount
                        : offer.item.count + count;
            else existingIndex = -1;
        }

        // The index at which we are adding the item.
        let trueIndex = existingIndex === -1 ? offerIndex : existingIndex;

        // Add the item to the offered array or update existing item.
        this.itemsOffered[trueIndex] = {
            inventoryIndex: index,
            maxCount: slot.count,
            item
        };

        // Any addition or removal of an item resets the trade acceptance.
        this.accepted = false;
        this.getActiveTrade()!.accepted = false;

        // Callbacks for both instances of the trade.
        this.signalAdd(this.player.instance, trueIndex, item.count, item.key);
    }

    /**
     * Relays a signal to both parties of the trade that the items have been updated.
     * @param instance The instance of the player who is adding the item.
     * @param offerIndex The index at which the item is being added in the offered array.
     * @param count The amount of the item we are adding.
     * @param key The key of the item we are adding.
     */

    private signalAdd(instance: string, offerIndex: number, count: number, key: string): void {
        this.addCallback?.(instance, offerIndex, count, key);
        this.getActiveTrade()?.addCallback?.(instance, offerIndex, count, key);
    }

    /**
     * Removes an item from the items offered array. This is then updated
     * to both instances of the trade. Visually it is added back to the inventory.
     * @param index The index in the itemsOffered array that we are removing.
     */

    public remove(index: number): void {
        if (!this.itemsOffered[index]) return;

        this.itemsOffered[index] = undefined;

        // Any addition or removal of an item resets the trade acceptance.
        this.accepted = false;
        this.getActiveTrade()!.accepted = false;

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
            // A trade is marked in progress as soon as it passes majority of checks and the exchange begins.
            if (this.inProgress) return;

            let emptySlots = this.player.inventory.getEmptySlots(),
                otherPlayerEmptySlots = this.activeTrade?.inventory.getEmptySlots(),
                offeredCount = this.getTotalOfferedCount(),
                otherOfferedCount = this.getActiveTrade()?.getTotalOfferedCount();

            // Ensure we have some number we're working with for empty slots.
            if (otherPlayerEmptySlots === undefined || otherOfferedCount === undefined) {
                this.accepted = false;
                return;
            }

            // Positive diff is we're offering more than other player, negative diff is we're being offered more.
            let diff = offeredCount - otherOfferedCount;

            // The difference indicates who is geting more items than they have available spaces
            if (diff !== emptySlots) {
                if (diff < 0 && emptySlots < Math.abs(diff)) return this.notEnoughSpace();
                if (diff > 0 && otherPlayerEmptySlots < diff)
                    return this.getActiveTrade()?.notEnoughSpace();
            }

            return this.exchange();
        }

        // Set the trade to accepted.
        this.accepted = true;

        // Relay to the client that one of the parties accepted the trade.
        this.acceptCallback?.('You have accepted the trade.');
        this.getActiveTrade()?.acceptCallback?.('The other player has accepted the trade.');
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
     * Sends a notification to both players that there's not enough space in the inventory.
     */

    private notEnoughSpace(): void {
        // Reset the accepted status.
        this.accepted = false;
        this.getActiveTrade()!.accepted = false;

        // Clear the trade for both players.
        this.acceptCallback?.();
        this.getActiveTrade()?.acceptCallback?.();

        this.activeTrade?.notify(
            `The other player does not have enough space in their inventory.`,
            '',
            'TRADE'
        );
        return this.player.notify(`You do not have enough space in your inventory.`, '', 'TRADE');
    }

    /**
     * The exchange begins when we have both players accept the trade. During this time
     * we temporarily lock any other trade actions from taking place.
     */

    private exchange(): void {
        // Set the trade to in progress.
        this.inProgress = true;

        // Remove the items from both players' inventories.
        let flagged = this.removeItemsBeforeTrade();

        if (flagged) {
            this.player.notify(`Please report a bug error, an error has occurred.`, '', 'TRADE');
            log.warning(
                `Trade exchange failed for ${this.player.username} and ${this.activeTrade?.username}.`
            );
            return this.close();
        }

        // Add the items to both players' inventories (we also store total items added for memes).
        let totalItems = this.addItemsAfterRemoving();

        // This is just a mini easter egg I like to include with basically everything at this point.
        if (totalItems === 0) {
            this.player.notify(`Yo why are y'all trading nothing?`, '', 'TRADE');
            this.activeTrade?.notify(`Yo why are y'all trading nothing?`, '', 'TRADE');
        } else {
            // Notify both that the trade is complete.
            this.player.notify(`Thank you for using Kaetram trading system!`, '', 'TRADE');
            this.activeTrade?.notify(`Thank you for using Kaetram trading system!`, '', 'TRADE');

            let offeredItems: unknown[] = [],
                receivedItems: unknown[] = [];

            // Store our player's item offers()) to an array
            this.forEachOfferedItem((item: Item) => {
                offeredItems.push(item.name);
            });

            // Store other player's item offer(s) to an array
            this.getActiveTrade()?.forEachOfferedItem((item: Item) => {
                receivedItems.push(item.name);
            });

            log.trade(
                `Player ${this.player.username} traded [${offeredItems}] for [${receivedItems}] with player ${this.activeTrade?.username}`
            );
        }

        this.close();
    }

    /**
     * Removes the items from both player's inventories prior to commencing the trade. We use the
     * offered items they have in their trade to remove them from their inventory. The idea is to
     * do this prior to adding the items to the other player's inventory so that we don't end up
     * with a no-space condition and not being able to add the item successfully.
     */

    private removeItemsBeforeTrade(): boolean {
        let flagged = false;

        // Remove the offered items from our player's inventory
        this.forEachOfferedItem((item: Item, inventoryIndex: number) => {
            // Stop everything if flagged.
            if (flagged) return;

            // Ensure that we are dealing with items that exist.
            if (!this.player.inventory.hasItem(item.key, item.count)) {
                flagged = true;
                return;
            }

            this.player.inventory.remove(inventoryIndex, item.count);
        });

        // Remove the offered items from the other player's inventory.
        this.getActiveTrade()?.forEachOfferedItem((item: Item, inventoryIndex: number) => {
            // Stop everything if flagged.
            if (flagged) return;

            // Ensure we are dealing with items that exist.
            if (!this.activeTrade?.inventory.hasItem(item.key, item.count)) {
                flagged = true;
                return;
            }

            this.activeTrade?.inventory.remove(inventoryIndex, item.count);
        });

        return flagged;
    }

    /**
     * After we have removed the items from both inventories, we need to add the items
     * from our offers into the other player's inventory, and vice versa.
     * @returns Total amounts of items that have been exchanged.
     */

    private addItemsAfterRemoving(): number {
        let totalItems = 0;

        // Adds the items from the other player's offers into our own inventory.
        this.getActiveTrade()?.forEachOfferedItem((item: Item) => {
            this.player.inventory.add(item);

            totalItems++;
        });

        // Adds the items from our offers into the other player's inventory.
        this.forEachOfferedItem((item: Item) => {
            this.activeTrade!.inventory.add(item);

            totalItems++;
        });

        return totalItems;
    }

    /**
     * Clears the active trade for the player.
     */

    public clear(): void {
        this.activeTrade = null;
        this.accepted = false;
        this.inProgress = false;

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
     * Looks through all the items and returns index of the item if it exists.
     * @param key Key of the item to look for.
     */

    private hasItem(key: string): number {
        let index = -1;

        for (let i in this.itemsOffered) {
            let item = this.itemsOffered[i];

            if (item && item.item.key === key) return parseInt(i);
        }

        return index;
    }

    /**
     * Checks if the item is already added to the trade.
     */

    private isAdded(index: number): boolean {
        return Object.values(this.itemsOffered).some(
            (offer) => offer?.inventoryIndex === index && offer.item.count === offer.maxCount
        );
    }

    /**
     * Iterates through every offered item in the dictionary and returns the item and its
     * index in the inventory.
     * @param callback A valid existing item within the offered slots and its inventory index.
     */

    private forEachOfferedItem(callback: (item: Item, inventoryIndex: number) => void): void {
        for (let offeredItem of Object.values(this.itemsOffered))
            if (offeredItem?.item) callback(offeredItem.item, offeredItem.inventoryIndex);
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

    public onAccept(callback: AcceptCallback): void {
        this.acceptCallback = callback;
    }
}
