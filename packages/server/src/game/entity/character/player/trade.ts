import { Trade as TradePacket } from '../../../../network/packets';

import log from '@kaetram/common/util/log';
import { Opcodes } from '@kaetram/common/network';

import type Player from './player';

/**
 * The trade instance is used to handle trading between two players. Whenever a trade is initiated,
 * both players will have a trade instance created for them. Each trade instance gets updated according
 * to the player's/other player's actions. When trade action occur, the packets must be sent to
 * both parties.
 */

export default class Trade {
    public lastRequest = ''; // The last person who requested to trade with the player.
    public activeTrade?: Player | null; // The player who we are currently trading with.

    public constructor(private player: Player) {}

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

        target.trade.lastRequest = this.player.instance;

        target.notify(`[Trade] ${this.player.username} has requested to trade with you.`);
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
