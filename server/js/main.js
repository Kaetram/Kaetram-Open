let fs = require("fs"),
    World = require('./game/world'),
    WebSocket = require('./network/websocket'),
    config = require('../config'),
    Log = require('./util/log'),
    Parser = require('./util/parser'),
    Database = require('./database/database'),
    _ = require('underscore'),
    Request = require('request'),
    world;

log = new Log(config.debugLevel, config.fsDebugging ? fs.createWriteStream('runtime.log') : null);

function main() {
    log.info('Initializing ' + config.name + ' game engine...');

    let webSocket = new WebSocket(config.host, config.port, config.gver),
        database = new Database(config.database),
        stdin = process.openStdin();

    webSocket.onConnect(function(connection) {
        if (world.allowConnections) {

            if (world.isFull()) {
                log.info('All the worlds are currently full. Please try again later.');

                connection.sendUTF8('full');
                connection.close();
            } else
                world.playerConnectCallback(connection);

        } else {
            connection.sendUTF8('disallowed');
            connection.close();
        }

    });


    webSocket.onWebSocketReady(function() {
        /**
         * Initialize the world after we have finished loading
         * the websocket.
         */

        loadParser();

        world = new World(webSocket, database.getDatabase());

        world.load(onWorldLoad);

    });

    stdin.addListener('data', (data) => {
        let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
            type = message.charAt(0);

        if (type !== '/')
            return;

        let blocks = message.substring(1).split(' '),
            command = blocks.shift();

        if (!command)
            return;

        switch (command) {

            case 'players':

                log.info(`There are a total of ${world.getPopulation()} player(s) logged in.`);

                break;

            case 'registered':

                world.database.registeredCount((count) => {
                    log.info(`There are ${count} users registered.`);
                });

                break;

            case 'deleteGuilds':

                world.database.deleteGuilds();

                break;

            case 'kill':

                let username = blocks.join(' ');

                if (!world.playerInWorld(username)) {
                    log.info('Player is not logged in.');
                    return;
                }

                let player = world.getPlayerByName(username);

                if (!player) {
                    log.info('An error has occurred.');
                    return;
                }

                world.kill(player);

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

                world.database.resetPositions(newX, newY, (result) => {
                    log.info(result);
                });

                break;

            case 'allowConnections':

                world.allowConnections = !world.allowConnections;

                if (world.allowConnections)
                    log.info('Server is now allowing connections.')
                else
                    log.info('The server is not allowing connections.');

                break;

        }
    });

}

function onWorldLoad() {
    log.notice(`World has successfully been created.`);

    if (!config.allowConnectionsToggle)
        world.allowConnections = true;

    var host = config.host === '0.0.0.0' ? 'localhost' : config.host;
    log.notice('Connect locally via http://' + host + ':' + config.port);
}

function loadParser() {
    new Parser();
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

main();
