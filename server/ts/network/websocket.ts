import connect from 'connect';
import serve from 'serve-static';
import request from 'request';
import SocketIO from 'socket.io';
import http from 'http';
import https from 'https';
import Connection from './connection';
import Socket from './socket';
import Utils from '../util/utils';
import config from '../../config';

/**
 *
 */
class WebSocket extends Socket {
    public _counter: any;

    public connectionCallback: any;

    public webSocketReadyCallback: any;

    host: any;

    version: any;

    ips: {};

    httpServer: https.Server | http.Server;

    io: any;

    constructor(host, port, version) {
        super(port);

        this.host = host;
        this.version = version;

        this.ips = {};

        const app = connect();

        app.use(serve('client-dist', { index: ['index.html'] }), null);

        const readyWebSocket = (port) => {
            console.info(`Server is now listening on: ${port}`);

            if (this.webSocketReadyCallback) this.webSocketReadyCallback();
        };

        const server = config.ssl ? https : http;

        this.httpServer = server.createServer(app).listen(port, host, () => {
            readyWebSocket(port);
        });

        this.io = new SocketIO(this.httpServer);
        this.io.on('connection', (socket) => {
            if (socket.handshake.headers['cf-connecting-ip'])
                socket.conn.remoteAddress =
                    socket.handshake.headers['cf-connecting-ip'];

            console.info(
                `Received connection from: ${socket.conn.remoteAddress}`
            );

            const client = new Connection(this.createId(), socket, this);

            socket.on('client', (data) => {
                if (data.gVer !== this.version) {
                    client.sendUTF8('updated');
                    client.close(
                        `Wrong client version - expected ${this.version} received ${data.gVer}`
                    );
                }

                if (this.connectionCallback) this.connectionCallback(client);

                this.addConnection(client);
            });
        });
    }

    createId() {
        return `1${Utils.random(9999)}${this._counter++}`;
    }

    onConnect(callback: (connection: Connection) => void) {
        this.connectionCallback = callback;
    }

    onWebSocketReady(callback: Function) {
        this.webSocketReadyCallback = callback;
    }
}

export default WebSocket;
