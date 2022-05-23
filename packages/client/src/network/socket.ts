import $ from 'jquery';
import { io, Socket as SocketIO } from 'socket.io-client';

import log from '../lib/log';
import Messages from './messages';

import type { APIData } from '@kaetram/common/types/api';
import type Game from '../game';

export default class Socket {
    public messages;

    private config;
    private connection!: SocketIO;
    private listening = false;

    public constructor(private game: Game) {
        this.config = game.app.config;
        this.messages = new Messages(game);
    }

    /**
     * Asks the hub for a server to connect to.
     * The connection assumes it is a hub, if it's not,
     * we default to normal server connection.
     */

    private getServer(callback: (data?: APIData) => void): void {
        // Skip if hub is disabled in the config.
        if (!this.config.hub) return callback();

        // Connect to specified game world if the worldSwitch is active.
        if (this.config.worldSwitch) return callback(this.game.world);

        // Attempt to get API data from the hub.

        try {
            $.get(`${this.config.hub}/server`, (response) => {
                console.log(response);
                callback(response.status === 'error' ? undefined : response);
            });
        } catch {
            callback();
        }
    }

    /**
     * Creates a websocket connection to the server.
     */

    public connect(): void {
        this.getServer((result) => {
            let { host, port } = result || this.config,
                url = this.config.ssl ? `wss://${host}` : `ws://${host}:${port}`;

            // Create a SocketIO connection with the url generated.
            this.connection = io(url, {
                forceNew: true,
                reconnection: false
            });

            // Handler for when a connection is successfully established.
            this.connection.on('connect', this.handleConnection.bind(this));

            // Handler for when a connection error occurs.
            this.connection.on('connect_error', () => this.handleConnectionError(host, port));

            // Handler for when a message is received.
            this.connection.on('message', (message) => this.receive(message.message || message));

            // Handler for when a disconnection occurs.
            this.connection.on('disconnect', () => this.game.handleDisconnection());
        });
    }

    /**
     * Parses a JSON string and passes the data onto the respective handlers
     * @param message JSON string information to be parsed.
     */

    private receive(message: string): void {
        if (!this.listening) return;

        if (message.startsWith('[')) {
            let data = JSON.parse(message);

            if (data.length > 1) this.messages.handleBulkData(data);
            else this.messages.handleData(data.shift());
        } else this.messages.handleUTF8(message);
    }

    /**
     * Sends a message through the socket to the server.
     * @param packet The packet ID in number format (see common/network/packets.ts);
     * @param data Packet data in an array format.
     */

    public send(packet: number, data?: unknown): void {
        let json = JSON.stringify([packet, data]);

        if (this.connection?.connected) this.connection.send(json);
    }

    /**
     * Handles successful connection and sends a handshake request signal.
     */

    private handleConnection(): void {
        this.listening = true;

        log.info('Connection established...');

        this.game.app.updateLoader('Preparing Handshake');

        this.connection.emit('client', {
            gVer: this.config.version,
            cType: 'HTML5'
        });
    }

    /**
     * Handle connection error in the event websocket fails.
     */

    private handleConnectionError(host: string, port: number): void {
        log.info(`Failed to connect to: ${host}`);

        this.listening = false;

        this.game.app.toggleLogin(false);

        this.game.app.sendError(
            window.config.debug
                ? `Couldn't connect to ${host}:${port}`
                : 'Could not connect to the game server.'
        );
    }
}
