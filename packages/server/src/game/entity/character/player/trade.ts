import { Trade as TradePacket } from '../../../../network/packets';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Opcodes } from '@kaetram/common/network';

import type { SlotData } from '@kaetram/common/types/slot';
import type Player from './player';
import type Slot from './containers/slot';

/**
 * The trade instance is used to handle trading between two players. Whenever a trade is initiated,
 * both players will have a trade instance created for them. Each trade instance gets updated according
 * to the player's/other player's actions. When trade action occur, the packets must be sent to
 * both parties.
 */

export default class Trade {
    // The items that the player is offering to the other player (use the other player's `itemOffered` to get the items exchanged.)
    private itemsOffered: Slot[] = [];

    public lastRequest = ''; // The last person who requested to trade with the player.
    public activeTrade?: Player | null; // The player who we are currently trading with.

    public openCallback?: (instance: string, slotData: SlotData) => void;

    public constructor(private player: Player) {}

    /**
     * Takes an item from the inventory and stores it into the items up for offer. These items
     * are used by both instances to commence the trade of items. Visually the item is taken
     * from the inventory and added into the trade interface.
     * @param item The slot in the inventory that we are offering to trade.
     */

    public add(item: Slot): void {
        // How would this even happen?
        if (this.itemsOffered.length >= this.player.inventory.size)
            return log.warning(`${this.player.username} has too many items in their trade.`);

        this.itemsOffered.push(item);
    }

    /**
     * Removes an item from the items offered array. This is then updated
     * to both instances of the trade. Visually it is added back to the inventory.
     * @param index The index in the itemsOffered array that we are removing.
     */

    public remove(index: number): void {
        this.itemsOffered.splice(index, 1);
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

        this.player.send(this.getOpenPacket(target.instance));
        target.send(this.getOpenPacket(this.player.instance));

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
        log.debug(
            `Closing trade between ${this.player.username} and ${this.activeTrade?.username}.`
        );

        // Close the trade for the player.
        this.player.send(new TradePacket(Opcodes.Trade.Close, {}));

        // Close the trade for the other party if they are still trading.
        this.activeTrade?.send(new TradePacket(Opcodes.Trade.Close, {}));

        // Clear the active trade for both players.
        this.clear();
        this.activeTrade?.trade.clear();
    }

    /**
     * Clears the active trade for the player.
     */

    public clear(): void {
        this.activeTrade = null;
        this.itemsOffered = [];
    }

    /**
     * Function to create a trading packet for opening the interface. Used to
     * prevent duplicate code in the open function.
     * @param instance The instance of the target player.
     */

    private getOpenPacket(instance: string): TradePacket {
        return new TradePacket(Opcodes.Trade.Open, {
            instance
        });
    }
}
