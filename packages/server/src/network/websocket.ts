import http from 'http';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import type { Server, Socket } from 'socket.io';
import type ws from 'ws';
import type Connection from './connection';
import type SocketHandler from './sockethandler';

export type AnySocket = Socket & ws.Server;
export type SocketType = 'WebSocket' | 'SocketIO';

export default abstract class WebSocket {
    private version = config.gver;

    public server!: Server | ws.Server; // The SocketIO server
    public httpServer!: http.Server;

    public addCallback?: (connection: Connection) => void;
    private initializedCallback?(): void;

    protected constructor(
        protected host: string,
        protected port: number,
        protected type: SocketType,
        protected socketHandler: SocketHandler
    ) {}

    public loadServer(): void {
        this.httpServer = http
            .createServer(this.httpResponse)
            .listen(this.port, this.host, this.ready.bind(this));
    }

    private ready(): void {
        log.info(`[${this.type}] Server is now listening on port: ${this.port}.`);

        this.initializedCallback?.();
    }

    /**
     * Returns an empty response if someone uses HTTP protocol
     * to access the server.
     */
    private httpResponse(_request: http.IncomingMessage, response: http.ServerResponse): void {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.write('This is server, why are you here?');
        response.end();
    }

    public verifyVersion(connection: Connection, gameVersion: string): boolean {
        let status = gameVersion === this.version;

        if (!status) {
            connection.sendUTF8('updated');
            connection.close(
                `Wrong client version, expected ${this.version} and received ${gameVersion}.`
            );
        }

        return status;
    }

    public onAdd(callback: (connection: Connection) => void): void {
        this.addCallback = callback;
    }

    public onInitialize(callback: () => void): void {
        this.initializedCallback = callback;
    }
}
