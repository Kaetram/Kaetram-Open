#!/usr/bin/env node

config = { debugLevel: 'all', gver: 1 };

var Utils = require('../../server/js/util/utils'),
    io = require('socket.io-client'),
    _ = require('underscore'),
    Log = require('../../server/js/util/log');
log = new Log('info');

class Entity {

    constructor(id, x, y, connection) {
        let self = this;

        self.id = id;
        self.x = x;
        self.y = y;

        self.connection = connection;
    }

}

module.exports = Entity;

class Bot {

    constructor() {
        let self = this;

        self.bots = [];
        self.botCount = 300;

        self.load();
    }

    load() {
        let self = this,
            connecting = setInterval(() => {
                self.connect();

                self.botCount--;

                if (self.botCount < 1)
                    clearInterval(connecting);
            }, 100);

        setInterval(() => {

            _.each(self.bots, (bot) => {
                self.move(bot);

                if (Utils.randomInt(0, 50) === 10)
                    self.talk(bot);
            });

        }, 2000);
    }

    connect() {
        let self = this,
            connection = null;

        connection = io('ws://127.0.0.1:9001', {
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
                var data = JSON.parse(message);

                if (data.length > 1)
                    _.each(data, (msg) => { self.handlePackets(connection, msg); });
                else
                    self.handlePackets(connection, JSON.parse(message).shift());

            } else
                self.handlePackets(connection, message, 'utf8');
        });

        connection.on('disconnect', () => {

        });


    }

    handlePackets(connection, message, type) {
        let self = this;

        if (type === 'utf8' || !_.isArray(message)) {
            log.info(`Received UTF8 message ${message}.`);
            return;
        }

        let opcode = message.shift();

        switch (opcode) {
            case 0:

                self.send(connection, 1, [2, 'n' + self.bots.length, 'n', 'n']);

                break;

            case 2:

                let info = message.shift();

                self.bots.push(new Entity(info.instance, info.x, info.y, connection));

                break;

            case 14: //Combat

                break;
        }

    }

    send(connection, packet, data) {
        var self = this,
            json = JSON.stringify([packet, data]);

        if (connection && connection.connected)
            connection.send(json);
    }

    move(bot) {
        let self = this,
            currentX = bot.x,
            currentY = bot.y,
            newX = currentX + Utils.randomInt(-3, 3),
            newY = currentY + Utils.randomInt(-3, 3);

        setTimeout(() => { // Movement Request

            self.send(bot.connection, 9, [0, newX, newY, currentX, currentY]);

        }, 250);

        setTimeout(() => { // Empty target packet

            self.send(bot.connection, 13, [2]);

        }, 250);

        setTimeout(() => { // Start Movement

            self.send(bot.connection, 9, [1, newX, newY, currentX, currentY, 250]);

        }, 250);

        setTimeout(() => { // Stop Movement
            self.send(bot.connection, 9, [3, newX, newY])
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
