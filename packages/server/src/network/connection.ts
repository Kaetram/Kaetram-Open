import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import type { WebSocket } from 'uws';
import type { ConnectionInfo, MessageCallback } from '@kaetram/common/types/network';

export interface HeaderWebSocket extends WebSocket<ConnectionInfo> {
    remoteAddress: string;
}

export default class Connection {
    public address = '';

    public messageCallback?: MessageCallback;

    // Used for filtering duplicate messages.
    private lastMessage = '';
    private lastMessageTime = Date.now();
    private messageDifference = 100; // Prevent duplicate messages coming in faster than 100ms.

    public messageRate = 0; // The amount of messages received in the last second.
    private timeoutDuration = 1000 * 60 * 10; // 10 minutes

    private rateInterval: NodeJS.Timeout | null = null;
    private verifyInterval: NodeJS.Timeout | null = null;
    private disconnectTimeout: NodeJS.Timeout | null = null;

    public closed = false;

    private closeCallback?: () => void;

    public constructor(
        public instance: string,
        private socket: HeaderWebSocket
    ) {
        // Convert the IP address hex string to a readable IP address.
        this.address =
            socket.remoteAddress || Utils.bufferToAddress(socket.getRemoteAddressAsText());

        // Reset the messages per second every second.
        this.rateInterval = setInterval(() => (this.messageRate = 0), 1000); // 1 second

        // Run the verification inteval every 30 seconds to ensure the connection is still open.
        this.verifyInterval = setInterval(this.isClosed.bind(this), 30_000); // 30 seconds

        log.info(`Received socket connection from: ${this.address}.`);
    }

    /**
     * Sends a UTF8 message to the client for closing the connection,
     * then closes the connection (duh).
     * @param reason UTF8 reason for why the connection was closed.
     */

    public reject(reason: string): void {
        // Tried rejecting an already closed connection, attempt to destroy the player class.
        if (this.closed) return this.handleClose(reason);

        this.sendUTF8(reason);
        this.close(reason);
    }

    /**
     * Closes a connection and takes a optional parameter for debugging purposes.
     * Depending on the type of socket currently present, a different function is used
     * for closing the connection.
     * @param details Optional parameter for debugging why connection was closed.
     * @param force Whether or not to forcefully call the close callback.
     */

    public close(details?: string, force = false): void {
        // Prevent accessing a closed connection.
        if (!this.closed) this.socket.end();

        if (details) log.info(`Connection ${this.address} has closed, reason: ${details}.`);

        if (force) this.handleClose();
    }

    /**
     * Receives the close signal and ends the connection with the socket.
     */

    public handleClose(reason?: string): void {
        log.info(`Closing socket connection to: ${this.address}.`);

        if (reason) log.info(`Received reason: ${reason}.`);

        this.closeCallback?.();

        this.clearTimeout();
        this.clearVerifyInterval();
    }

    /**
     * Updates the timeout duration for the player and refreshes the existing timeout.
     * @param duration The new duration of the timeout.
     */

    public updateTimeout(duration: number): void {
        this.timeoutDuration = duration;

        this.refreshTimeout();
    }

    /**
     * Resets the timeout every time an action is performed. This way we keep
     * a `countdown` going constantly that resets every time an action is performed.
     */

    public refreshTimeout(): void {
        // Clear the existing timeout and start over.
        this.clearTimeout();

        // Start a new timeout and set the player's timeout variable.
        this.disconnectTimeout = setTimeout(() => this.reject('timeout'), this.timeoutDuration);
    }

    /**
     * Removes the connection verification interval.
     */

    private clearVerifyInterval(): void {
        if (!this.verifyInterval) return;

        clearInterval(this.verifyInterval);
        this.verifyInterval = null;
    }

    /**
     * Clears the existing disconnect timeout.
     */

    private clearTimeout(): void {
        if (!this.disconnectTimeout) return;

        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = null;
    }

    /**
     * A player may be able to spam the server with the packets that are
     * the same. We want to ensure duplicate packets are only parsed once
     * every `messageDifference` milliseconds. There may be cases
     * where duplicate messages are needed, such as when a player is repeatedly
     * clicking a store or button.
     * @param message String message to be checked.
     * @returns Whether or not the message is a duplicate and should be ignored.
     */

    public isDuplicate(message: string): boolean {
        return (
            message === this.lastMessage &&
            Date.now() - this.lastMessageTime < this.messageDifference
        );
    }

    /**
     * Verifies whether the connection has been closed and the
     * player is still online. This should not occur unless the
     * connection improperly closes.
     */

    private isClosed(): void {
        if (!this.closed) return;

        log.warning(`Connection ${this.address} closed improperly.`);

        this.handleClose();
    }

    /**
     * Takes a JSON object and stringifies it. It sends that string
     * to the client in the UTF8 format.
     * @param message Typically a JSON object of some sort.
     */

    public send(message: unknown): void {
        this.sendUTF8(JSON.stringify(message));
    }

    /**
     * Sends a simple UTF8 string to the socket.
     * @param message A string message.
     */

    public sendUTF8(message: string): void {
        // Prevent sending messages to a closed connection, log for debugging.
        if (this.closed) {
            log.warning(`Attempted to send message to closed connection.`);
            return log.trace();
        }

        this.socket.send(message);
    }

    /**
     * Callback for when a message is received.
     * @param callback Sends over the packet data received.
     */

    public onMessage(callback: MessageCallback): void {
        this.messageCallback = callback;
    }

    /**
     * Callback for when the connection is closed.
     */

    public onClose(callback: () => void): void {
        this.closeCallback = callback;
    }
}
