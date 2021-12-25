import { Server } from 'socket.io';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Connection from '../connection';
import WebSocket, { AnySocket } from '../websocket';

import type SocketHandler from '../sockethandler';
import { Modules } from '@kaetram/common/network';

export default class SocketIO extends WebSocket {
    public constructor(socketHandler: SocketHandler) {
        super(config.host, config.socketioPort, 'SocketIO', socketHandler);
        super.loadServer();

        this.server = new Server(this.httpServer, {
            cors: {
                origin: '*'
            }
        });

        this.server.on('connection', this.handleConnection.bind(this));
    }

    /**
     * Unsure what type to specify for the socket here. If anyone has the time
     * and energy to really figure it out go on ahead please.
     * I can't be bothered to focus too much on SocketIO since the intention
     * is to completely deprecate it once Godot client becomes more advanced.
     * TODO - Figure out the types for this.
     */

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleConnection(socket: any): void {
        let remoteAddress = (socket.handshake.headers['cf-connecting-ip'] as string) || '127.0.0.1';

        log.info(`Received connection from: ${remoteAddress}.`);

        let connection = new Connection(
            Utils.createInstance(Modules.EntityType.Player),
            this.type,
            remoteAddress,
            socket as AnySocket,
            this.socketHandler
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('client', (data: any) => {
            if (!this.verifyVersion(connection, data.gVer)) return;

            this.addCallback?.(connection);
        });
    }
}
