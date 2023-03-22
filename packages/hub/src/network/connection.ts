import type { WebSocket } from 'uws';
import type { ConnectionInfo, MessageCallback } from '@kaetram/common/types/network';

export default class Connection {
    public messageCallback?: MessageCallback;

    public constructor(public socket: WebSocket<ConnectionInfo>) {}

    /**
     * Sends a message to the socket connection.
     * @param message A message in a string format.
     */

    public send(message: string): void {
        this.socket.send(message);
    }

    /**
     * Gracefully closes the socket connection.
     */

    public close(): void {
        this.socket.end();
    }

    /**
     * Callback for when a message is received over the socket.
     * @param callback Contains the string message that was received.
     */

    public onMessage(callback: MessageCallback): void {
        this.messageCallback = callback;
    }
}
