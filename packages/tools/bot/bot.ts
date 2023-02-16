#!/usr/bin/env -S yarn tsx

import Entity from './entity';

import config from '@kaetram/common/config';
import { Packets } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { io } from 'socket.io-client';

import type { Socket } from 'socket.io-client';

interface PacketInfo {
    instance: string;
    x: number;
    y: number;
}

export default class Bot {
    #bots: Entity[] = [];
    #botCount = 300;

    public constructor() {
        this.load();
    }

    private load(): void {
        let connecting = setInterval(() => {
            this.connect();

            if (--this.#botCount < 1) clearInterval(connecting);
        }, 100);

        setInterval(() => {
            for (let bot of this.#bots) {
                this.move(bot);

                if (Utils.randomInt(0, 50) === 10) this.talk(bot);
            }
        }, 2000);
    }

    private connect(): void {
        let connection = io('ws://127.0.0.1:9001', {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false
        });

        connection.on('connect', () => {
            log.info('Connection established...');

            connection.emit('client', {
                gVer: config.gver,
                cType: 'HTML5'
            });
        });

        connection.on('connect_error', () => {
            log.info('Failed to establish connection.');
        });

        connection.on('message', (message: string) => {
            if (message.startsWith('[')) {
                let data = JSON.parse(message);

                if (data.length > 1) for (let msg of data) this.handlePackets(connection, msg);
                else this.handlePackets(connection, JSON.parse(message).shift());
            } else this.handlePackets(connection, message as never, 'utf8');
        });

        // connection.on('disconnect', () => {});
    }

    private handlePackets(connection: Socket, message: [Packets, PacketInfo], type?: string): void {
        if (type === 'utf8' || !Array.isArray(message)) {
            log.info(`Received UTF8 message ${message}.`);

            return;
        }

        let [opcode, info] = message;

        switch (opcode) {
            case Packets.Handshake: {
                this.send(connection, 1, [2, `n${this.#bots.length}`, 'n', 'n']);

                break;
            }

            case Packets.Welcome: {
                this.#bots.push(new Entity(info.instance, info.x, info.y, connection));

                break;
            }

            case Packets.Combat: {
                break;
            }
        }
    }

    private send(connection: Socket, packet: number, data: (string | number)[]): void {
        let json = JSON.stringify([packet, data]);

        if (connection?.connected) connection.send(json);
    }

    private move(bot: Entity): void {
        let currentX = bot.x,
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

    private talk(bot: Entity): void {
        this.send(bot.connection, 20, ['am human, hello there.']);
    }
}

new Bot();
