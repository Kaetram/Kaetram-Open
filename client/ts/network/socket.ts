import io from 'socket.io-client';

import Game from '../game';
import Messages from './messages';

export default class Socket {
    config: any;
    connection: any;
    listening: boolean;
    disconnected: boolean;
    messages: Messages;

    constructor(public game: Game) {
        this.game = game;
        this.config = this.game.app.config;
        this.connection = null;

        this.listening = false;

        this.disconnected = false;

        this.messages = new Messages(this.game.app);
    }

    connect() {
        let url;

        if (this.config.ssl) url = `wss://${this.config.ip}`;
        else url = `ws://${this.config.ip}:${this.config.port}`;

        this.connection = null;

        this.connection = io(url, {
            forceNew: true,
            reconnection: false,
        });

        this.connection.on('connect_error', () => {
            console.info(`Failed to connect to: ${this.config.ip}`);

            this.listening = false;

            this.game.app.toggleLogin(false);

            if (this.game.isDebug()) {
                this.game.app.sendError(
                    null,
                    `Couldn't connect to ${this.config.ip}:${this.config.port}`
                );
            } else {
                this.game.app.sendError(
                    null,
                    'Could not connect to the game server.'
                );
            }
        });

        this.connection.on('connect', () => {
            this.listening = true;

            console.info('Connection established...');

            this.game.app.updateLoader('Preparing Handshake');

            this.connection.emit('client', {
                gVer: this.config.version,
                cType: 'HTML5',
            });
        });

        this.connection.on('message', (message) => {
            const actualMessage = message.message ? message.message : message;

            this.receive(actualMessage);
        });

        this.connection.on('disconnect', () => {
            this.game.handleDisconnection();
        });
    }

    receive(message) {
        if (!this.listening) return;

        if (message.startsWith('[')) {
            const data = JSON.parse(message);

            if (data.length > 1) this.messages.handleBulkData(data);
            else this.messages.handleData(JSON.parse(message).shift());
        } else this.messages.handleUTF8(message);
    }

    send(packet, data?) {
        const json = JSON.stringify([packet, data]);

        if (this.connection && this.connection.connected) {
            this.connection.send(json);
        }
    }
}
