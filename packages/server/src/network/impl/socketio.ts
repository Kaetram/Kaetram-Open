import { Server, Socket } from 'socket.io';

import config from '../../../config';
import log from '../../util/log';
import Utils from '../../util/utils';
import Connection from '../connection';
import WebSocket from '../websocket';

import type SocketHandler from '../sockethandler';

export default class SocketIO extends WebSocket {
    constructor(socketHandler: SocketHandler) {
        super(config.host, config.socketioPort, 'SocketIO', socketHandler);
        super.loadServer();

        this.server = new Server(this.httpServer, {
            cors: {
                origin: '*'
            }
        });

        this.server.on('connection', (socket: Socket) => {
            if (socket.handshake.headers['cf-connecting-ip'])
                socket.conn.remoteAddress = socket.handshake.headers['cf-connecting-ip'];

            log.info(`Received connection from: ${socket.conn.remoteAddress}.`);

            let connection = new Connection(
                Utils.getConnectionId(),
                this.type,
                socket,
                this.socketHandler
            );

            socket.on('client', (data) => {
                if (!this.verifyVersion(connection, data.gVer)) return;

                if (this.addCallback) this.addCallback(connection);
            });
        });
    }
}
