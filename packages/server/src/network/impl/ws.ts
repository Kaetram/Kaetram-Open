import ws from 'ws';

import config from '../../../config';

import WebSocket from '../websocket';
import Connection from '../connection';

import Utils from '../../util/utils';
import log from '../../util/log';
import SocketHandler from '../sockethandler';

export default class WS extends WebSocket {
    constructor(socketHandler: SocketHandler) {
        super(config.host, config.websocketPort, 'WebSocket', socketHandler);

        this.server = new ws.Server({ port: this.port });

        this.server.on('connection', (socket: ws.Socket, request: any) => {
            let mappedAddress = request.socket.remoteAddress,
                remoteAddress = mappedAddress.split('::ffff:')[1];

            socket.conn = { remoteAddress: remoteAddress };

            log.info(`Received connection from: ${socket.conn.remoteAddress}.`);

            // TODO - Handle client version....

            let connection = new Connection(
                Utils.getConnectionId(),
                this.type,
                socket,
                this.socketHandler
            );

            if (this.addCallback) this.addCallback(connection);
        });
    }
}
