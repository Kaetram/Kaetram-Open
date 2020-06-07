let World = require('./game/world'),
    WebSocket = require('./network/websocket'),
    Log = require('./util/log'),
    Parser = require('./util/parser'),
    Database = require('./database/database');

config = require('../config')
log = new Log();

class Main {

    constructor() {
        let self = this;

        log.info('Initializing ' + config.name + ' game engine...');

        self.webSocket = new WebSocket(config.host, config.port, config.gver);
        self.database = new Database(config.database);
        self.parser = new Parser();
        self.world = null;

        self.webSocket.onWebSocketReady(() => {
            /**
             * Initialize the world after we have finished loading
             * the websocket.
             */

             let onWorldLoad = function() {
                 log.notice(`World has successfully been created.`);

                 if (!config.allowConnectionsToggle)
                     self.world.allowConnections = true;

                 var host = config.host === '0.0.0.0' ? 'localhost' : config.host;
                 log.notice('Connect locally via http://' + host + ':' + config.port);
             };

             self.world = new World(self.webSocket, self.getDatabase());

             self.world.load(onWorldLoad);
        });

        self.webSocket.onConnect((connection) => {

            if (self.world.allowConnections) {

                if (self.world.isFull()) {
                    log.info('All the worlds are currently full. Please try again later.');

                    connection.sendUTF8('full');
                    connection.close();
                } else
                    self.world.playerConnectCallback(connection);

            } else {
                connection.sendUTF8('disallowed');
                connection.close();
            }

        });

        self.loadConsole();
    }

    loadConsole() {
        let self = this,
            stdin = process.openStdin();

        stdin.addListener('data', (data) => {
            let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
                type = message.charAt(0);

            if (type !== '/')
                return;

            let blocks = message.substring(1).split(' '),
                command = blocks.shift();

            if (!command)
                return;

            let username, player;

            switch (command) {

                case 'players':

                    log.info(`There are a total of ${self.getPopulation()} player(s) logged in.`);

                    break;

                case 'registered':

                    self.world.database.registeredCount((count) => {
                        log.info(`There are ${count} users registered.`);
                    });

                    break;

                case 'kill':

                    username = blocks.join(' ');

                    if (!self.world.isOnline(username)) {
                        log.info('Player is not logged in.');
                        return;
                    }

                    player = self.world.getPlayerByName(username);

                    if (!player) {
                        log.info('An error has occurred.');
                        return;
                    }

                    self.world.kill(player);

                    break;

                case 'resetPositions':

                    let newX = parseInt(blocks.shift()),
                        newY = parseInt(blocks.shift());

                    //x: 325, y: 87

                    if (!newX || !newY) {
                        log.info('Invalid command parameters. Expected: /resetPositions <newX> <newY>');
                        return;
                    }

                    /**
                     * We are iterating through all of the users in the database
                     * and resetting their position to the paramters inputted.
                     * This is to be used when doing some game-breaking map
                     * updates. This command is best used in tandem with the
                     * `allowConnectionsToggle` to prevent users from logging
                     * in.
                     */

                    self.world.database.resetPositions(newX, newY, (result) => {
                        log.info(result);
                    });

                    break;

                case 'allowConnections':

                    self.world.allowConnections = !self.world.allowConnections;

                    if (self.world.allowConnections)
                        log.info('Server is now allowing connections.')
                    else
                        log.info('The server is not allowing connections.');

                    break;

                case 'give':

                    let itemId = blocks.shift(),
                        itemCount = parseInt(blocks.shift());

                    username = blocks.join(' ');

                    player = self.world.getPlayerByName(username);

                    if (!player)
                        return;

                    player.inventory.add({
                        id: itemId,
                        count: itemCount,
                        ability: -1,
                        abilityLevel: -1
                    });

                    break;

            }
        });
    }

    getDatabase() {
        return this.database.getDatabase();
    }

    getPopulation() {
        return this.world.getPopulation();
    }

}

if ( typeof String.prototype.startsWith !== 'function' ) {
    String.prototype.startsWith = function(str) {
        return str.length > 0 && this.substring( 0, str.length ) === str;
    };
}

if ( typeof String.prototype.endsWith !== 'function' ) {
    String.prototype.endsWith = function(str) {
        return str.length > 0 && this.substring( this.length - str.length, this.length ) === str;
    };
}

module.exports = Main;

new Main();
