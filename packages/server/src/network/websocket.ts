import log from '../util/log';
import config from '../../config';

import Connection from './connection';
import { Server, Socket } from 'socket.io';
import http from 'http';
import https from 'https';
import Utils from '../util/utils';

export default class WebSocket {
    public host: string;
    public port: number;

    public version: string;

    public ips: { [id: string]: number }
    public connections: { [id: string]: Connection };

    public server: Server; // The SocketIO server
    public httpServer: http.Server | https.Server;

    private counter: number;

    private readyCallback: () => void;
    private connectionCallback: (connection: Connection) => void;

    constructor(host: string, port: number, version: string) {
        this.host = host;
        this.port = port;

        this.version = version;

        this.ips = {};
        this.connections = {};

        this.httpServer = (config.ssl ? https : http).createServer(this.httpResponse)
            .listen(this.port, this.host, () => {
                log.info(`Server is now listening on port: ${this.port}.`);

                if (this.readyCallback) this.readyCallback();
            });

        this.server = new Server(this.httpServer, {
            cors: {
                origin: '*'
            }
        });
        this.server.on('connection', (socket: Socket) => {
            if (socket.handshake.headers['cf-connecting-ip'])
                socket.conn.remoteAddress = socket.handshake.headers['cf-connecting-ip'];

            log.info(`Received connection from: ${socket.conn.remoteAddress}.`);

            let connection = new Connection(this.getId(), socket, this);

            socket.on('client', (data: any) => {
                if (!this.verifyVersion(connection, data.gVer)) return;

                this.add(connection);
            });
        });

        this.counter = 0;
    }

    /**
     * Returns an empty response if someone uses HTTP protocol
     * to access the server.
     */

    httpResponse(_request: any, response: any) {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.write('This is server, why are you here?');
        response.end();
    }

    verifyVersion(connection: Connection, gameVersion: string): boolean {
        let status = gameVersion === this.version;

        if (!status) {
            connection.sendUTF8('updated');
            connection.close(`Wrong client version, expected ${this.version} and received ${gameVersion}.`);
        }

        return status;
    }

    /**
     * We add a connection to our dictionary of connections.
     * 
     * Key: The connection id.
     * Value: The connection itself.
     * 
     * @param connection The connection we are adding.
     */

    add(connection: Connection) {
        this.connections[connection.id] = connection;

        if (this.connectionCallback) this.connectionCallback(connection);
    }

    /**
     * Used to remove connections from our dictionary of connections.
     * 
     * @param id The connection id we are removing.
     */

    remove(id: string) {
        delete this.connections[id];
    }

    /**
     * Finds and returns a connection in our dictionary of connections.
     * 
     * @param id The id of the connection we are trying to get.
     * @returns The connection element or null.
     */

    get(id: string): Connection {
        return this.connections[id];
    }

    /**
     * @returns A randomly generated id based on counter of connections.
     */

    getId(): string {
        return '1' + Utils.random(1000) + this.counter;
    }

    /**
     * The callback that the main class uses to determine
     * if the websocket is ready.
     * 
     * @param callback The void function callback
     */

    onReady(callback: () => void) {
        this.readyCallback = callback;
    }

    /**
     * The callback for when a new connection is received.
     * 
     * @param callback The callback containing the Connection that occurs.
     */

    onConnection(callback: (connection: Connection) => void) {
        this.connectionCallback = callback;
    }

}