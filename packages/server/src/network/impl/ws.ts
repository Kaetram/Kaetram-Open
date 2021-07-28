import ws from 'ws';

import config from '../../../config';

import WebSocket from '../websocket';
import Connection from '../connection';

import type { Socket } from 'socket.io';

import Utils from '../../util/utils';
import log from '../../util/log';
import SocketHandler from '../sockethandler';

declare module 'ws' {
    interface WebSocket {
        conn: { remoteAddress: string };
    }
}

export default class WS extends WebSocket {
    constructor(socketHandler: SocketHandler) {
        super(config.host, config.websocketPort, 'WebSocket', socketHandler);

        const server = new ws.Server({ port: this.port });

        server.on('connection', (socket, request) => {
            let mappedAddress = request.socket.remoteAddress!,
                [, remoteAddress] = mappedAddress.split('::ffff:');

            socket.conn = { remoteAddress };

            log.info(`Received connection from: ${socket.conn.remoteAddress}.`);

            // TODO - Handle client version....

            const connection = new Connection(
                Utils.getConnectionId(),
                this.type,
                socket as Socket,
                this.socketHandler
            );

            if (this.addCallback) this.addCallback(connection);
        });

        this.server = server;
    }
}
