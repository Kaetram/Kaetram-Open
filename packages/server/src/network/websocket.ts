import log from '../util/log';
import config from '../../config';

import Connection from './connection';
import SocketHandler from './sockethandler';

import { Server, Socket } from 'socket.io';
import ws from 'ws';
import http from 'http';

export default class WebSocket {
    public host: string;
    public port: number;

    public version: string;
    public type: string;

    public server: Server | ws.Server; // The SocketIO server
    public httpServer: http.Server;
    public socketHandler: SocketHandler;

    public addCallback: (connection: Connection) => void;
    private initializedCallback: () => void;

    constructor(host: string, port: number, type: string, socketHandler: SocketHandler) {
        this.host = host;
        this.port = port;

        this.version = config.gver;
        this.type = type;

        this.socketHandler = socketHandler;
    }

    loadServer() {
        this.httpServer = http.createServer(this.httpResponse).listen(this.port, this.host, () => {
            log.info(`[${this.type}] Server is now listening on port: ${this.port}.`);

            if (this.initializedCallback) this.initializedCallback();
        });
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
            connection.close(
                `Wrong client version, expected ${this.version} and received ${gameVersion}.`
            );
        }

        return status;
    }

    onAdd(callback: (connection: Connection) => void) {
        this.addCallback = callback;
    }

    onInitialize(callback: () => void) {
        this.initializedCallback = callback;
    }
}
