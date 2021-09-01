import $ from 'jquery';
import { io, Socket as SocketIO } from 'socket.io-client';

import log from '../lib/log';
import Messages from './messages';

import type { APIData } from '@kaetram/common/types/api';
import type Game from '../game';

export default class Socket {
    private config;
    public messages;

    private connection!: SocketIO;

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
    private async getServer(callback: (data: APIData | null) => void): Promise<void> {
        if (!this.config.hub) return callback(null);

        if (this.config.worldSwitch) {
            callback(this.game.world);

            return;
        }

        try {
            let response = await $.get(`${this.config.hub}/server`);

            callback(typeof response === 'string' ? null : response);
        } catch {
            callback(null);
        }
    }

    public connect(): void {
        this.getServer((result) => {
            let { host, port } = result || this.config,
                url = this.config.ssl ? `wss://${host}` : `ws://${host}:${port}`;

            this.connection = io(url, {
                forceNew: true,
                reconnection: false
            });

            this.connection.on('connect_error', () => {
                log.info(`Failed to connect to: ${host}`);

                this.listening = false;

                this.game.app.toggleLogin(false);

                this.game.app.sendError(
                    null,
                    this.game.isDebug()
                        ? `Couldn't connect to ${host}:${port}`
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
                let actualMessage = message.message || message;

                this.receive(actualMessage);
            });

            this.connection.on('disconnect', () => this.game.handleDisconnection());
        });
    }

    private receive(message: string): void {
        if (!this.listening) return;

        if (message.startsWith('[')) {
            let data = JSON.parse(message);

            if (data.length > 1) this.messages.handleBulkData(data);
            else this.messages.handleData(data.shift());
        } else this.messages.handleUTF8(message);
    }

    public send(packet: number, data?: unknown[]): void {
        let json = JSON.stringify([packet, data]);

        if (this.connection?.connected) this.connection.send(json);
    }
}
