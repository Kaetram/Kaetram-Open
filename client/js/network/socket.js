/* global log */

define(['./packets', './messages'], function(Packets, Messages) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;
            self.config = self.game.app.config;
            self.connection = null;

            self.listening = false;

            self.disconnected = false;

            self.messages = new Messages(self.game.app);
        },

        connect: function() {
            var self = this,
                url = 'ws://' + self.config.ip + ':' + self.config.port;

            self.connection = null;

            self.connection = io(url, {
                forceNew: true,
                reconnection: false
            });

            self.connection.on('connect_error', function() {
                log.info('Failed to connect to: ' + self.config.ip);

                self.listening = false;

                self.game.app.toggleLogin(false);
                self.game.app.sendError(null, 'Could not connect to the game server.');
            });

            self.connection.on('connect', function() {
                self.listening = true;

		        log.info('Connection established...');

                self.game.app.updateLoader('Preparing Handshake');

                self.connection.emit('client', {
                    gVer: self.config.version,
                    cType: 'HTML5'
                });
            });

            self.connection.on('message', function(message) {
                var actualMessage = message.message ? message.message : message;

                self.receive(actualMessage);
            });

            self.connection.on('disconnect', function() {
                self.game.handleDisconnection();
            });
        },

        receive: function(message) {
            var self = this;

            if (!self.listening)
                return;

            if (message.startsWith('[')) {
                var data = JSON.parse(message);

                if (data.length > 1)
                    self.messages.handleBulkData(data);
                else
                    self.messages.handleData(JSON.parse(message).shift());

            } else
                self.messages.handleUTF8(message);

        },

        send: function(packet, data) {
            var self = this,
                json = JSON.stringify([packet, data]);

            if (self.connection && self.connection.connected)
                self.connection.send(json);
        }

    });

});
