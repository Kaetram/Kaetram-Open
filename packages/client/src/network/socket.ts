import $ from 'jquery';
import { io } from 'socket.io-client';

import log from '../lib/log';
import Messages from './messages';

import type { Socket as IOSocket } from 'socket.io-client';
import type Game from '../game';

export default class Socket {
    private config;
    public messages;

    private connection!: IOSocket;

    private listening = false;
    // disconnected = false;

    public constructor(private game: Game) {
        this.config = game.app.config;
        this.messages = new Messages(game.app);
    }

    /**
     * Asks the hub for a server to connect to.
     * The connection assumes it is a hub, if it's not,
     * we default to normal server connection.
     */
    private async getServer(
        callback: (data: { host: string; port: number } | 'error') => void
    ): Promise<void> {
        let url = `http://${this.config.ip}:${this.config.port}/server`;

        if (this.config.ssl) url = `https://${this.config.ip}/server`;

        try {
            const response = await $.get(url);

            callback(typeof response === 'string' ? 'error' : response);
        } catch {
            callback('error');
        }
    }

    public connect(): void {
        this.getServer((result) => {
            let url;

            if (result === 'error')
                url = this.config.ssl
                    ? `wss://${this.config.ip}`
                    : `ws://${this.config.ip}:${this.config.port}`;
            else if (this.config.ssl) url = `wss://${result.host}`;
            else url = `ws://${result.host}:${result.port}`;

            this.connection = io(url, {
                forceNew: true,
                reconnection: false
            });

            this.connection.on('connect_error', () => {
                log.info(`Failed to connect to: ${this.config.ip}`);

                this.listening = false;

                this.game.app.toggleLogin(false);

                this.game.app.sendError(
                    null,
                    this.game.isDebug()
                        ? `Couldn't connect to ${this.config.ip}:${this.config.port}`
                        : 'Could not connect to the game server.'
                );
            });

            this.connection.on('connect', () => {
                this.listening = true;

                log.info('Connection established...');

                this.game.app.updateLoader('Preparing Handshake');

                this.connection.emit('client', {
                    gVer: this.config.version,
                    cType: 'HTML5'
                });
            });

            this.connection.on('message', (message) => {
                const actualMessage = message.message || message;

                this.receive(actualMessage);
            });

            this.connection.on('disconnect', () => this.game.handleDisconnection());
        });
    }

    private receive(message: string): void {
        if (!this.listening) return;

        if (message.startsWith('[')) {
            const data = JSON.parse(message);

            if (data.length > 1) this.messages.handleBulkData(data);
            else this.messages.handleData(JSON.parse(message).shift());
        } else this.messages.handleUTF8(message);
    }

    public send(packet: number, data?: unknown[]): void {
        const json = JSON.stringify([packet, data]);

        if (this.connection?.connected) this.connection.send(json);
    }
}
