import http from 'http';

import config from '../../config';
import log from '../util/log';

import type { Server } from 'socket.io';
import type ws from 'ws';
import type Connection from './connection';
import type SocketHandler from './sockethandler';

export default abstract class WebSocket {
    private version = config.gver;

    public server!: Server | ws.Server; // The SocketIO server
    public httpServer!: http.Server;

    public addCallback?: (connection: Connection) => void;
    private initializedCallback?(): void;

    constructor(
        protected host: string,
        protected port: number,
        protected type: string,
        protected socketHandler: SocketHandler
    ) {}

    loadServer(): void {
        this.httpServer = http.createServer(this.httpResponse).listen(this.port, this.host, () => {
            log.info(`[${this.type}] Server is now listening on port: ${this.port}.`);

            if (this.initializedCallback) this.initializedCallback();
        });
    }

    /**
     * Returns an empty response if someone uses HTTP protocol
     * to access the server.
     */

    httpResponse(_request: http.IncomingMessage, response: http.ServerResponse): void {
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

    onAdd(callback: (connection: Connection) => void): void {
        this.addCallback = callback;
    }

    onInitialize(callback: () => void): void {
        this.initializedCallback = callback;
    }
}
