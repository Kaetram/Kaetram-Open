import Socket from './socket';
import log from '../util/log';
import config from '../../config';

import Connection from './connection';
import * as WS from 'ws';
import * as SocketIO from 'socket.io';
import * as http from 'http';
import * as https from 'https';
import Utils from '../util/utils';

class WebSocket extends Socket {
    host: string;
    version: string;
    ips: {};

    httpServer: http.Server | https.Server;
    io: SocketIO;
    ws: WS.Server

    public connectionCallback: any;
    public webSocketReadyCallback: any;

    constructor(host: string, port: number, version: string) {
        super(port);

        this.host = host;
        this.version = version;

        this.ips = {};

        let readyWebSocket = (port: number) => {
            log.info('Server is now listening on: ' + port);

            if (this.webSocketReadyCallback) this.webSocketReadyCallback();
        };

        let server = config.ssl ? https : http;

        this.httpServer = server
            .createServer((_request, response) => {
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.write('This is server, why are you here?');
                response.end();
            })
            .listen(port, host, () => {
                readyWebSocket(port);
            });

        this.io = new SocketIO(this.httpServer);
        this.io.on('connection', (socket: any) => {
            if (socket.handshake.headers['cf-connecting-ip'])
                socket.conn.remoteAddress = socket.handshake.headers['cf-connecting-ip'];

            log.info('Received connection from: ' + socket.conn.remoteAddress);

            let client = new Connection(this.createId(), socket, this);

            socket.on('client', (data: any) => {
                if (data.gVer !== this.version) {
                    client.sendUTF8('updated');
                    client.close(
                        'Wrong client version - expected ' + this.version + ' received ' + data.gVer
                    );
                }

                if (this.connectionCallback) this.connectionCallback(client);

                this.addConnection(client);
            });
        });

        if (!config.websocketEnabled)
            return;

        log.info('Initializing secondary websocket.');

        this.ws = new WS.Server({ port: config.websocketPort });

        this.ws.on('connection', (socket: any, request: any) => {
            let mappedAddress = request.socket.remoteAddress,
                remoteAddress = mappedAddress.split('::ffff:')[1];

            socket.conn = { remoteAddress: remoteAddress };

            log.info('Received raw websocket connection from: ' + socket.conn.remoteAddress);

            let client = new Connection(this.createId(), socket, this, true);

            if (this.connectionCallback) this.connectionCallback(client);

            this.addConnection(client);
        });
    }

    createId() {
        return '1' + Utils.random(9999) + '' + this._counter++;
    }

    onConnect(callback: Function) {
        this.connectionCallback = callback;
    }

    onWebSocketReady(callback: Function) {
        this.webSocketReadyCallback = callback;
    }
}

export default WebSocket;
