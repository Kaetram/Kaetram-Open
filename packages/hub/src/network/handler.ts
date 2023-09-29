import Connection from './connection';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Utils from '@kaetram/common/util/utils';
import { App, DEDICATED_COMPRESSOR_3KB, type WebSocket } from 'uws';

import type { ConnectionInfo } from '@kaetram/common/types/network';

/**
 * The hub websocket works as a publisher/subscriber system. It is responsible for
 * synchronizing events between the servers without relying on ridiculous amount
 * of GET/POST API calls. This is a very simple implementation of a uWebSocket.
 */

export default class Handler {
    public ready = false;

    private connections: { [instance: string]: Connection } = {};

    private connectionCallback?: (instance: string, connection: Connection) => void;
    private disconnectCallback?: (instance: string) => void;

    public constructor() {
        App({})
            .ws('/*', {
                compression: DEDICATED_COMPRESSOR_3KB,
                idleTimeout: 0,
                maxPayloadLength: 32 * 1024 * 1024,

                open: this.handleConnection.bind(this),
                message: this.handleMessage.bind(this),
                close: this.handleClose.bind(this)
            })
            .listen(config.hubWsPort, (socket: WebSocket<ConnectionInfo>) => {
                if (!socket) throw new Error(`Failed to listen on port ${config.hubWsPort}`);

                this.ready = true;
            });
    }

    /**
     * Grabs a connection based on the instance provided.
     * @param instance The instance of the server we want to grab.
     * @returns The WebSocket connection given the instance.
     */

    private get(instance: string): Connection {
        return this.connections[instance];
    }

    /**
     * Handles receiving a message from a socket. We just log the connection for now,
     * the identification part comes with the handshake packet in the next step.
     * @params socket The socket that has just connected to the hub.
     */

    private handleConnection(socket: WebSocket<ConnectionInfo>): void {
        log.notice(
            `Received a connection from ${Utils.bufferToAddress(socket.getRemoteAddressAsText())}`
        );

        let instance = Utils.createInstance();

        socket.getUserData().instance = instance;

        // We store the connection in the connections object so that we can use it later.
        this.connections[instance] = new Connection(socket);

        // Create a new callback for when the connection has been established.
        this.connectionCallback?.(instance, this.connections[instance]);
    }

    /**
     * Handles a message from the socket. We decode the message and parse the JSOn data.
     * @param socket The socket that the message was received from.
     * @param data Contains buffer of the message that was received.
     */

    private handleMessage(socket: WebSocket<ConnectionInfo>, data: ArrayBuffer): void {
        let connection = this.get(socket.getUserData().instance);

        if (!connection)
            return log.error(`No connection found for instance ${socket.getUserData().instance}`);

        try {
            let message = JSON.parse(new TextDecoder().decode(data));

            connection.messageCallback?.(message);
        } catch (error) {
            log.error(`Message could not be parsed: ${new TextDecoder().decode(data)}.`);
            log.error(error);
        }
    }

    /**
     * Handles closing a connection and removing the connection from the connections object.
     * @param socket The socket that has just closed.
     */

    private handleClose(socket: WebSocket<ConnectionInfo>): void {
        this.disconnectCallback?.(socket.getUserData().instance);

        delete this.connections[socket.getUserData().instance];
    }

    /**
     * Callback for when a connection has been established with the hub.
     * @param callback Contains the connection object.
     */

    public onConnection(callback: (instance: string, connection: Connection) => void): void {
        this.connectionCallback = callback;
    }

    /**
     * Callback for when a connection has been closed.
     * @param callback Contains the instance of the server that has been disconnected.
     */

    public onDisconnect(callback: (instance: string) => void): void {
        this.disconnectCallback = callback;
    }
}
