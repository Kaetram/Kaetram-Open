import { Server } from 'socket.io';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Connection from '../connection';
import WebSocket, { AnySocket } from '../websocket';

import type SocketHandler from '../sockethandler';

export default class SocketIO extends WebSocket {
    public constructor(socketHandler: SocketHandler) {
        super(config.host, config.socketioPort, 'SocketIO', socketHandler);
        super.loadServer();

        this.server = new Server(this.httpServer, {
            cors: {
                origin: '*'
            }
        });

        this.server.on('connection', (socket) => {
            if (socket.handshake.headers['cf-connecting-ip'])
                socket.conn.remoteAddress = socket.handshake.headers['cf-connecting-ip'];

            log.info(`Received connection from: ${socket.conn.remoteAddress}.`);

            let connection = new Connection(
                Utils.getConnectionId(),
                this.type,
                socket as AnySocket,
                this.socketHandler
            );

            socket.on('client', (data) => {
                if (!this.verifyVersion(connection, data.gVer)) return;

                this.addCallback?.(connection);
            });
        });
    }
}
