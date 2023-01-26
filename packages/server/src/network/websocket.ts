import http from 'node:http';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import type { Server } from 'socket.io';
import type Connection from './connection';
import type SocketHandler from './sockethandler';

export default abstract class WebSocket {
    private version = config.gver;

    public server!: Server; // The SocketIO server
    public httpServer!: http.Server;

    public addCallback?: (connection: Connection) => void;
    private initializedCallback?: () => void;

    protected constructor(
        protected host: string,
        protected port: number,
        protected socketHandler: SocketHandler
    ) {}

    /**
     * Create the HTTP server for incoming connections. This will
     * become the future admin panel.
     */

    public loadServer(): void {
        this.httpServer = http
            .createServer(this.httpResponse)
            .listen(this.port, this.host, this.ready.bind(this));
    }

    /**
     * Output the port we are listening on and the socket type that
     * is ready to receive connections.
     */

    private ready(): void {
        log.notice(`Server is now listening on port: ${this.port}.`);

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

    /**
     * Checks if the connection's game version matches the server's game version.
     * Reject the connection should there be a mismatch.
     * @param connection The connection we will reject should version mismatch.
     * @param gameVersion The game version we received from the connection.
     * @returns Whether the game's version matches the connection's game version.
     */

    public verifyVersion(connection: Connection, gameVersion: string): boolean {
        let status = gameVersion === this.version;

        if (!status) connection.reject('updated');

        return status;
    }

    /**
     * Callback for when a connection is added.
     * @param callback Contains the connection that was just added.
     */

    public onAdd(callback: (connection: Connection) => void): void {
        this.addCallback = callback;
    }

    /**
     * Callback for when the web socket has finished initializing.
     */

    public onInitialize(callback: () => void): void {
        this.initializedCallback = callback;
    }
}
