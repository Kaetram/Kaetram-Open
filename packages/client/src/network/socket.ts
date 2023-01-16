import Messages from './messages';

import log from '../lib/log';

import { io } from 'socket.io-client';

import type { SerializedServer } from '@kaetram/common/types/api';
import type { Socket as SocketIO } from 'socket.io-client';
import type Game from '../game';

export default class Socket {
    public messages;

    private config;
    private connection!: SocketIO;
    private listening = false;

    public constructor(private game: Game) {
        this.config = game.app.config;
        this.messages = new Messages(game.app);
    }

    /**
     * Asks the hub for a server to connect to.
     * The connection assumes it is a hub, if it's not,
     * we default to normal server connection.
     */

    private async getServer(): Promise<SerializedServer | undefined> {
        // Skip if hub is disabled in the config.
        if (!this.config.hub) return;

        // Attempt to get API data from the hub.
        try {
            let result = await fetch(`${this.config.hub}/server`);

            return await result.json();
        } catch {
            return;
        }
    }

    /**
     * Creates a websocket connection to the server.
     */

    public async connect(server?: SerializedServer): Promise<void> {
        let { host, port } = server || (await this.getServer()) || this.config,
            url = this.config.ssl ? `wss://${host}` : `ws://${host}:${port}`;

        // Create a SocketIO connection with the url generated.
        this.connection = io(url, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false
        });

        // Handler for when a connection is successfully established.
        this.connection.on('connect', this.handleConnection.bind(this));

        // Handler for when a connection error occurs.
        this.connection.on('connect_error', (err) => {
            console.error(`connect_error due to ${err.message}`);
            this.handleConnectionError(host, port);
        });

        // Handler for when a message is received.
        this.connection.on('message', (message) => this.receive(message.message || message));

        // Handler for when a disconnection occurs.
        this.connection.on('disconnect', () => this.game.handleDisconnection());

        /**
         * The audio controller can only be properly initialized when the player interacts
         * with the website. This is the best possible place to initialize it.
         */

        this.game.audio.createContext();
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

        this.game.app.updateLoader('Preparing handshake');

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
