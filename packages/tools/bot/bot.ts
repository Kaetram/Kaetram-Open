#!/usr/bin/env node

import Utils from '@kaetram/server/ts/util/utils';
import io from 'socket.io-client';
import { each, isArray } from 'lodash';

const log = console;

const config = { debugLevel: 'all', gver: 1 };

class Entity {
    id;
    x: number;
    y: number;
    connection: SocketIOClient.Socket;

    constructor(id, x: number, y: number, connection: SocketIOClient.Socket) {
        this.id = id;
        this.x = x;
        this.y = y;

        this.connection = connection;
    }
}

// export default Entity;

class Bot {
    bots: Entity[];
    botCount: number;

    constructor() {
        this.bots = [];
        this.botCount = 300;

        this.load();
    }

    load(): void {
        const connecting = setInterval(() => {
            this.connect();

            this.botCount--;

            if (this.botCount < 1) clearInterval(connecting);
        }, 100);

        setInterval(() => {
            each(this.bots, (bot) => {
                this.move(bot);

                if (Utils.randomInt(0, 50) === 10) this.talk(bot);
            });
        }, 2000);
    }

    connect(): void {
        const connection = io('ws://127.0.0.1:9001', {
            forceNew: true,
            reconnection: false
        });

        connection.on('connect', () => {
            log.info('Connection established...');

            connection.emit('client', {
                gVer: config.gver,
                cType: 'HTML5',
                bot: true
            });
        });

        connection.on('connect_error', () => {
            log.info('Failed to establish connection.');
        });

        connection.on('message', (message) => {
            if (message.startsWith('[')) {
                const data = JSON.parse(message);

                if (data.length > 1)
                    each(data, (msg) => {
                        this.handlePackets(connection, msg);
                    });
                else this.handlePackets(connection, JSON.parse(message).shift());
            } else this.handlePackets(connection, message, 'utf8');
        });

        connection.on('disconnect', () => {
            //
        });
    }

    handlePackets(connection: SocketIOClient.Socket, message: never[], type?: string): void {
        if (type === 'utf8' || !isArray(message)) {
            log.info(`Received UTF8 message ${message}.`);
            return;
        }

        const opcode: number = message.shift();

        switch (opcode) {
            case 0:
                this.send(connection, 1, [2, 'n' + this.bots.length, 'n', 'n']);

                break;

            case 2: {
                const info: { instance: string; x: number; y: number } = message.shift();

                this.bots.push(new Entity(info.instance, info.x, info.y, connection));

                break;
            }

            case 14: //Combat
                break;
        }
    }

    send(connection: SocketIOClient.Socket, packet: number, data: (string | number)[]): void {
        const json = JSON.stringify([packet, data]);

        if (connection && connection.connected) connection.send(json);
    }

    move(bot: Entity): void {
        const currentX = bot.x,
            currentY = bot.y,
            newX = currentX + Utils.randomInt(-3, 3),
            newY = currentY + Utils.randomInt(-3, 3);

        setTimeout(() => {
            // Movement Request

            this.send(bot.connection, 9, [0, newX, newY, currentX, currentY]);
        }, 250);

        setTimeout(() => {
            // Empty target packet

            this.send(bot.connection, 13, [2]);
        }, 250);

        setTimeout(() => {
            // Start Movement

            this.send(bot.connection, 9, [1, newX, newY, currentX, currentY, 250]);
        }, 250);

        setTimeout(() => {
            // Stop Movement
            this.send(bot.connection, 9, [3, newX, newY]);
        }, 1000);

        bot.x = newX;
        bot.y = newY;
    }

    talk(bot: Entity): void {
        this.send(bot.connection, 20, ['am human, hello there.']);
    }
}

// export default Bot;

new Bot();
