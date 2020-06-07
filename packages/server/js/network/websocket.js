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

        let self = this;

        self.host = host;
        self.version = version;

        self.ips = {};

        let app = connect();
        app.use(serve('client', {'index': ['index.html']}), null);

        let readyWebSocket = function(port) {
            log.info('Server is now listening on: ' + port);

            if (self.webSocketReadyCallback)
                self.webSocketReadyCallback();
        };

        let server = config.ssl ? https : http;

        self.httpServer = server.createServer(app).listen(port, host, () => {
            readyWebSocket(port);
        });

        self.io = new SocketIO(self.httpServer);
        self.io.on('connection', (socket) => {
            if (socket.handshake.headers['cf-connecting-ip'])
                socket.conn.remoteAddress = socket.handshake.headers['cf-connecting-ip'];

            log.info('Received connection from: ' + socket.conn.remoteAddress);

            let client = new Connection(self.createId(), socket, self);

            socket.on('client', (data) => {
                if (data.gVer !== self.version) {
                    client.sendUTF8('updated');
                    client.close('Wrong client version - expected ' + self.version + ' received ' + data.gVer);
                }

                if (self.connectionCallback)
                    self.connectionCallback(client);

                self.addConnection(client);
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
