import ws from 'ws';

import config from '../../../config';
import log from '../../util/log';
import Utils from '../../util/utils';
import Connection from '../connection';
import SocketHandler from '../sockethandler';
import WebSocket, { AnySocket } from '../websocket';

declare module 'ws' {
    interface WebSocket {
        conn: { remoteAddress: string };
    }
}

export default class WS extends WebSocket {
    public constructor(socketHandler: SocketHandler) {
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
                socket as AnySocket,
                this.socketHandler
            );

            this.addCallback?.(connection);
        });

        this.server = server;
    }
}
