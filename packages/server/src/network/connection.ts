import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import type { WebSocket } from 'uws';
import type { ConnectionInfo, MessageCallback } from '@kaetram/common/types/network';

export default class Connection {
    public address = '';

    public messageCallback?: MessageCallback;

    // Used for filtering duplicate messages.
    private lastMessage = '';
    private lastMessageTime = Date.now();
    private messageDifference = 100; // Prevent duplicate messages coming in faster than 100ms.

    private disconnectTimeout: NodeJS.Timeout | null = null;
    private timeoutDuration = 1000 * 60 * 10; // 10 minutes

    private closeCallback?: () => void;

    public constructor(public instance: string, private socket: WebSocket<ConnectionInfo>) {
        // Convert the IP address hex string to a readable IP address.
        this.address = Utils.bufferToAddress(socket.getRemoteAddressAsText());
    }

    /**
     * Sends a UTF8 message to the client for closing the connection,
     * then closes the connection (duh).
     * @param reason UTF8 reason for why the connection was closed.
     */

    public reject(reason: string): void {
        this.sendUTF8(reason);
        this.close(reason);
    }

    /**
     * Closes a connection and takes a optional parameter for debugging purposes.
     * Depending on the type of socket currently present, a different function is used
     * for closing the connection.
     * @param details Optional parameter for debugging why connection was closed.
     */

    public close(details?: string): void {
        this.socket.end();

        if (details) log.info(`Connection ${this.address} has closed, reason: ${details}.`);
    }

    /**
     * Receives the close signal and ends the connection with the socket.
     */

    public handleClose(): void {
        log.info(`Closing socket connection to: ${this.address}.`);

        this.closeCallback?.();
        this.clearTimeout();
    }

    /**
     * Resets the timeout every time an action is performed. This way we keep
     * a `countdown` going constantly that resets every time an action is performed.
     * @param duration The duration of the timeout. Defaults to the player's timeout duration.
     */

    public refreshTimeout(duration = this.timeoutDuration): void {
        // Clear the existing timeout and start over.
        this.clearTimeout();

        // Start a new timeout and set the player's timeout variable.
        this.disconnectTimeout = setTimeout(() => this.reject('timeout'), duration);
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
