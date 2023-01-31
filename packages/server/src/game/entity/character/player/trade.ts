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

export default class Trade {
    // The items that the player is offering to the other player (use the other player's `itemOffered` to get the items exchanged.)
    private itemsOffered: Item[] = [];

    public lastRequest = ''; // The last person who requested to trade with the player.
    public activeTrade?: Player | null; // The player who we are currently trading with.

    public openCallback?: OpenCallback;
    public addCallback?: AddCallback;
    public removeCallback?: RemoveCallback;

    public constructor(private player: Player) {}

    /**
     * Takes an item from the inventory and stores it into the items up for offer. These items
     * are used by both instances to commence the trade of items. Visually the item is taken
     * from the inventory and added into the trade interface.
     * @param index The index in the inventory of the slot we selected.
     * @param count The amount of items we are offering to trade.
     */

    public add(index: number, count = -1): void {
        // How would this even happen?
        if (this.itemsOffered.length >= this.player.inventory.size)
            return log.warning(`${this.player.username} has too many items in their trade.`);

        // Grab the slot from the inventory.
        let slot = this.player.inventory.get(index);

        // Ensure the slot exists and is not empty.
        if (slot?.isEmpty()) return;

        // Create an item instance and make necessary changes to it.
        let item = this.player.inventory.getItem(slot);

        // Ensure the item exists.
        if (!item) return;

        // Sync the count of the item in the inventory with the count of the item in the trade.
        item.count = count === -1 ? slot.count : count;

        // Add the item to the items offered array.
        this.itemsOffered.push(this.player.inventory.getItem(slot));

        // The index at which we are adding the item to the items offered array.
        let tradeIndex = this.itemsOffered.length - 1;

        // Callbacks for both instances of the trade.
        this.addCallback?.(this.player.instance, tradeIndex, item.count, item.key);
        this.getActiveTrade()?.addCallback?.(
            this.player.instance,
            tradeIndex,
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
        this.itemsOffered.splice(index, 1);

        // Send the callback to both trade instances.
        this.removeCallback?.(this.player.instance, index);
        this.getActiveTrade()?.removeCallback?.(this.player.instance, index);
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
        this.clear();
        this.getActiveTrade()?.clear();
    }

    /**
     * Clears the active trade for the player.
     */

    public clear(): void {
        this.activeTrade = null;
        this.itemsOffered = [];
    }

    /**
     * @returns The currently active trade (the instance of the other player's trade.)
     */

    public getActiveTrade(): Trade | undefined {
        return this.activeTrade?.trade;
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
}
