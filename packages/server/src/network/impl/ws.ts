import ws from 'ws';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

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

        let server = new ws.Server({ port: this.port });

        server.on('connection', (socket, request) => {
            let mappedAddress = request.socket.remoteAddress!,
                [, remoteAddress] = mappedAddress.split('::ffff:');

            socket.conn = { remoteAddress };

            log.info(`Received connection from: ${socket.conn.remoteAddress}.`);

            // TODO - Handle client version....

            let connection = new Connection(
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
