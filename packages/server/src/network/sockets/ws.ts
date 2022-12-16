import { WebSocketServer } from 'ws';
import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import Connection from '../connection';
import WebSocket from '../websocket';

import type SocketHandler from '../sockethandler';
import type { AnySocket } from '../websocket';
import type http from 'node:http';

declare module 'ws' {
    interface WebSocket {
        conn: { remoteAddress: string };
    }
}

export default class WS extends WebSocket {
    public constructor(socketHandler: SocketHandler) {
        super(config.host, config.websocketPort, 'WebSocket', socketHandler);

        this.server = new WebSocketServer({ port: this.port });
        this.server.on('connection', this.handleConnection.bind(this));
    }

    /**
     * We handle each connection individually and add it to our list.
     * @param socket The socket connection we have just received.
     * @param request An http request since WebSocket protocol is layered on top of TCP.
     */

    private handleConnection(socket: AnySocket, request: http.ServerResponse): void {
        let rawAddress = request.socket?.remoteAddress, //Raw ipv6 address.
            remoteAddress = rawAddress!.replace('::ffff:', '');

        log.info(`Received connection from: ${remoteAddress}.`);

        let id = Utils.createInstance(Modules.EntityType.Player),
            connection = new Connection(id, this.type, remoteAddress, socket, this.socketHandler);

        this.addCallback?.(connection);
    }
}
