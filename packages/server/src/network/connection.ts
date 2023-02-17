import log from '@kaetram/common/util/log';

import type { Socket } from 'socket.io';
import type { Packets } from '@kaetram/common/network';
import type SocketHandler from './sockethandler';

type MessageCallback = (message: [Packets, never]) => void;

export default class Connection {
    private messageCallback?: MessageCallback;
    private closeCallback?: () => void;

    // Used for filtering duplicate messages.
    private lastMessage = '';
    private lastMessageTime = Date.now();
    private messageDifference = 100; // Prevent duplicate messages coming in faster than 100ms.

    private disconnectTimeout: NodeJS.Timeout | null = null;
    private timeoutDuration = 1000 * 60 * 10; // 10 minutes

    public constructor(
        public instance: string,
        public address: string,
        private socket: Socket,
        private socketHandler: SocketHandler
    ) {
        this.socket.once('disconnect', this.handleClose.bind(this));
        this.socket.on('message', this.handleMessage.bind(this));
    }

    /**
     * Sends a UTF8 message to the client for closing the connection,
     * then closes the connection (duh).
     * @param reason UTF8 reason for why the connection was closed.
     * @param withCallback Whether or not to call the close callback.
     */

    public reject(reason: string, withCallback = false): void {
        this.sendUTF8(reason);
        this.close(reason, withCallback);
    }

    /**
     * Closes a connection and takes a optional parameter for debugging purposes.
     * Depending on the type of socket currently present, a different function is used
     * for closing the connection.
     * @param details Optional parameter for debugging why connection was closed.
     * @param withCallback Whether or not to call the close callback.
     */

    public close(details?: string, withCallback = true): void {
        this.socket.disconnect(true);

        if (details) log.info(`Connection ${this.address} has closed, reason: ${details}.`);

        /**
         * Before you question the redundancy of this. SocketIO experiences an issue where the player
         * closes the browser but the `disconnect` signal is not being fired. This is a solution to the
         * problem. We do not want `closeCallback` called twice unnecessarily, but in the event that
         * `handleClose` does not fire up due to the issue mentioned above, we want to call the callback
         * forcibly through here. Since the `disconnect` signal is not fired, then the timeout will continue
         * to countdown (`handleClose` is never fired) until it forcibly calls this function and kicks the
         * player out. In the event that we rely on the timeout to kick the player out, this callback will
         * only fire once, since again, the reason this exists is because `disconnect` doesn't fire properly.
         */

        if (withCallback) this.closeCallback?.();
    }

    /**
     * Attempts to parse the string and convert it to a JSON.
     * An error is caught if the JSON fails to properly parse.
     * @param message JSON message string to be parsed.
     */

    private handleMessage(message: string): void {
        // Skip duplicates in a certain timeframe.
        if (this.isDuplicate(message)) return;

        try {
            this.messageCallback?.(JSON.parse(message));

            this.lastMessage = message;
            this.lastMessageTime = Date.now();
        } catch (error) {
            log.error(`Message could not be parsed: ${message}.`);
            log.error(error);
        }
    }

    /**
     * Receives the close signal and ends the connection with the socket.
     */

    private handleClose(): void {
        log.info(`Closed socket: ${this.address}.`);

        this.socketHandler.remove(this.instance);

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
        this.disconnectTimeout = setTimeout(() => this.reject('timeout', true), duration);
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
