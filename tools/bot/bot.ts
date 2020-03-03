#!/usr/bin/env node

/** @format */

import Utils from '../../server/ts/util/utils';
import io from 'socket.io-client';
import _ from 'underscore';
import Log from 'log';
import config from '../../server/config.json';

class Entity {
    id: any;
    x: any;
    y: any;
    connection: any;

    constructor(id, x, y, connection) {
        this.id = id;
        this.x = x;
        this.y = y;

        this.connection = connection;
    }

}

module.exports = Entity;

class Bot {
	public botCount: any;
	public bots: any;

    constructor() {
        this.bots = [];
        this.botCount = 350;

        this.load();
    }

    load() {
        const connecting = setInterval(() => {
                this.connect();

                this.botCount--;

                if (this.botCount < 1)
                    clearInterval(connecting);
            }, 200);

        setInterval(() => {

            _.each(this.bots, (bot) => {
                this.move(bot);
                this.talk(bot);
            });

        }, 2500);
    }

    connect() {
        let connection = null;

        connection = io('ws://127.0.0.1:9001', {
            forceNew: true,
            reconnection: false
        });

        connection.on('connect', () => {
            console.info('Connection established...');

            connection.emit('client', {
                gVer: config.gver,
                cType: 'HTML5',
                bot: true
            });

        });

        connection.on('connect_error', () => {
            console.info('Failed to establish connection.');
        });

        connection.on('message', (message) => {

            if (message.startsWith('[')) {
                const data = JSON.parse(message);

                if (data.length > 1)
                    _.each(data, (msg) => { this.handlePackets(connection, msg); });
                else
                    this.handlePackets(connection, JSON.parse(message).shift());

            } else
                this.handlePackets(connection, message, 'utf8');
        });

        connection.on('disconnect', () => {

        });


    }

    handlePackets(connection, message, type?) {
        

        if (type === 'utf8' || !_.isArray(message)) {
            console.info(`Received UTF8 message ${message}.`);
            return;
        }

        const opcode = message.shift();

        switch (opcode) {
            case 0:

                this.send(connection, 1, [2, 'n' + this.bots.length, 'n', 'n']);

                break;

            case 2:

                const info = message.shift();

                this.bots.push(new Entity(info.instance, info.x, info.y, connection));

                break;

            case 14: //Combat

                break;
        }

    }

    send(connection, packet, data) {
        const 
            json = JSON.stringify([packet, data]);

        if (connection && connection.connected)
            connection.send(json);
    }

    move(bot) {
        const 
            currentX = bot.x,
            currentY = bot.y,
            newX = currentX + Utils.randomInt(-3, 3),
            newY = currentY + Utils.randomInt(-3, 3);

        setTimeout(() => { // Movement Request

            this.send(bot.connection, 9, [0, newX, newY, currentX, currentY]);

        }, 250);

        setTimeout(() => { // Empty target packet

            this.send(bot.connection, 13, [2]);

        }, 250);

        setTimeout(() => { // Start Movement

            this.send(bot.connection, 9, [1, newX, newY, currentX, currentY, 250]);

        }, 250);

        setTimeout(() => { // Stop Movement
            this.send(bot.connection, 9, [3, newX, newY]);
        }, 1000);

        bot.x = newX;
        bot.y = newY;
    }

    talk(bot) {
        this.send(bot.connection, 20, ['am human, hello there.']);
    }

}

module.exports = Bot;

new Bot();
