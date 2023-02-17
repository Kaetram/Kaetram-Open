import Connection from '../connection';
import WebSocket from '../websocket';

import config from '@kaetram/common/config';
import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Server } from 'socket.io';

import type { Socket } from 'socket.io';
import type SocketHandler from '../sockethandler';

export default class SocketIO extends WebSocket {
    public constructor(socketHandler: SocketHandler) {
        super(config.host, config.port, socketHandler);
        super.loadServer();

        this.server = new Server(this.httpServer, {
            cors: { origin: '*' }
        });

        this.server.on('connection', this.handleConnection.bind(this));
    }

    private handleConnection(socket: Socket): void {
        let remoteAddress = (socket.handshake.headers['cf-connecting-ip'] as string) || '127.0.0.1',
            connection = new Connection(
                Utils.createInstance(Modules.EntityType.Player),
                remoteAddress,
                socket,
                this.socketHandler
            );

        log.info(`Received connection from: ${remoteAddress}.`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('client', (data: any) => {
            if (!this.verifyVersion(connection, data.gVer)) return socket.disconnect(true);

            this.addCallback?.(connection);
        });
    }
}
