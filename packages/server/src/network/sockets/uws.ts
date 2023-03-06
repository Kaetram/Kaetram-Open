import WebSocket from '../websocket';
import Connection from '../connection';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';
import { App, DEDICATED_COMPRESSOR_3KB } from 'uws';

import type SocketHandler from '../sockethandler';
import type { WebSocket as WS } from 'uws';
import type { ConnectionInfo } from '@kaetram/common/types/network';

export default class UWS extends WebSocket {
    public constructor(socketHandler: SocketHandler) {
        super(config.host, config.port, socketHandler);

        App({})
            .get('/*', this.httpResponse.bind(this))
            .ws('/*', {
                compression: DEDICATED_COMPRESSOR_3KB,
                idleTimeout: 10,
                maxPayloadLength: 32 * 1024 * 1024,

                open: this.handleConnection.bind(this),
                message: this.handleMessage.bind(this),
                close: this.handleClose.bind(this)
            })
            .listen(config.port, (socket: WS<ConnectionInfo>) => {
                if (!socket) throw new Error(`Failed to listen on port ${config.port}`);

                this.initializedCallback?.();
            });
    }

    /**
     * Handles the creation and organizing of a socket. With UWS we store the instance
     * into the socket's user data so that we can identify the socket later on.
     * @param socket The socket that the connection will be created for.
     */

    private handleConnection(socket: WS<ConnectionInfo>): void {
        let instance = Utils.createInstance(Modules.EntityType.Player),
            connection = new Connection(instance, socket);

        socket.getUserData().instance = instance;

        this.addCallback?.(connection);
    }

    /**
     * Responsible for converting the buffer into a string and then parsing it into JSON.
     * @param socket The socket that the message was received from (used to identify the connection).
     * @param data Contains buffer data that we convert into a string.
     */

    private handleMessage(socket: WS<ConnectionInfo>, data: ArrayBuffer): void {
        let connection = this.socketHandler.get(socket.getUserData().instance);

        // Prevent the server from crashing if the connection is not found.
        if (!connection)
            return log.error(`No connection found for ${socket.getUserData().instance}`);

        try {
            // Conver the buffer into a string.
            let message = new TextDecoder().decode(data);

            // Prevent duplicates in a short period of time.
            if (connection.isDuplicate(message)) return;

            // Pass the parsed JSON onto the message handler.
            connection.messageCallback?.(JSON.parse(message));
        } catch (error) {
            log.error(`Message could not be parsed: ${new TextDecoder().decode(data)}.`);
            log.error(error);
        }
    }

    /**
     * Handles closing the socket and removing our connection from the handler.
     * @param socket The socket that we are closing (used to identify the connection).
     */

    private handleClose(socket: WS<ConnectionInfo>): void {
        let connection = this.socketHandler.get(socket.getUserData().instance);

        if (!connection)
            return log.error(`No connection found closing ${socket.getUserData().instance}`);

        this.socketHandler.remove(connection.instance);

        connection.handleClose();
    }
}
