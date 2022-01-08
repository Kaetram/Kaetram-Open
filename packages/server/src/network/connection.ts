import log from '@kaetram/common/util/log';

import type { Packets } from '@kaetram/common/network';
import type SocketHandler from './sockethandler';
import type { AnySocket, SocketType } from './websocket';

type MessageCallback = (message: [Packets, never]) => void;

export default class Connection {
    private messageCallback?: MessageCallback;
    private closeCallback?: () => void;

    public constructor(
        public id: string,
        public type: SocketType,
        public address: string,
        private socket: AnySocket,
        private socketHandler: SocketHandler
    ) {
        this.socket.on('message', this.handleMessage.bind(this));
        this.socket.on(this.getCloseSignal(), this.handleClose.bind(this));
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
        if (details) log.info(`Connection ${this.address} has closed, reason: ${details}.`);

        this.type === 'WebSocket' ? this.socket.close() : this.socket.disconnect(true);
    }

    /**
     * Attempts to parse the string and convert it to a JSON.
     * An error is caught if the JSON fails to properly parse.
     * @param message JSON message string to be parsed.
     */

    private handleMessage(message: string): void {
        try {
            this.messageCallback?.(JSON.parse(message));
        } catch (error: unknown) {
            log.error(`Message could not be parsed: ${message}.`);
            log.error(error);
        }
    }

    /**
     * Receives the close signal and ends the connection with the socket.
     */

    private handleClose(): void {
        log.info(`Closed socket: ${this.address}.`);

        this.closeCallback?.();

        this.socketHandler.remove(this.id);
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
     * Depending on the type of socket connection,
     * we use a different keyword for determining
     * the closing callback.
     */

    public getCloseSignal(): 'close' | 'disconnect' {
        return this.type === 'WebSocket' ? 'close' : 'disconnect';
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
