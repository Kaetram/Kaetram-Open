/* global module */

let Socket = require('./socket'),
    Connection = require('./connection'),
    connect = require('connect'),
    serve = require('serve-static'),
    request = require('request'),
    SocketIO = require('socket.io'),
    http = require('http'),
    https = require('https'),
    Utils = require('../util/utils');

class WebSocket extends Socket {

    constructor(host, port, version) {
        super(port);

        this.host = host;
        this.version = version;

        this.ips = {};

        let app = connect();
        app.use(serve('client', {'index': ['index.html']}), null);

        let readyWebSocket = (port) => {
            log.info('Server is now listening on: ' + port);

            if (this.webSocketReadyCallback)
                this.webSocketReadyCallback();
        };

        let server = config.ssl ? https : http;

        this.httpServer = server.createServer(app).listen(port, host, () => {
            readyWebSocket(port);
        });

        this.io = new SocketIO(this.httpServer);
        this.io.on('connection', (socket) => {
            if (socket.handshake.headers['cf-connecting-ip'])
                socket.conn.remoteAddress = socket.handshake.headers['cf-connecting-ip'];

            log.info('Received connection from: ' + socket.conn.remoteAddress);

            let client = new Connection(this.createId(), socket, this);

            socket.on('client', (data) => {
                if (data.gVer !== this.version) {
                    client.sendUTF8('updated');
                    client.close('Wrong client version - expected ' + this.version + ' received ' + data.gVer);
                }

                if (this.connectionCallback)
                    this.connectionCallback(client);

                this.addConnection(client);
            });
        });
    }

    createId() {
        return '1' + Utils.random(9999) + '' + this._counter++;
    }

    onConnect(callback) {
        this.connectionCallback = callback;
    }

    onWebSocketReady(callback) {
        this.webSocketReadyCallback = callback;
    }
}

module.exports = WebSocket;
