/** @format */
import log from './util/logger';
import World from './game/world';
import WebSocket from './network/websocket';
import config from '../config.json';
import Parser from './util/parser';
import Database from './database/database';

let world: World;

function onWorldLoad() {
    console.info('World has successfully been created.');

    if (!config.allowConnectionsToggle) world.allowConnections = true;

    const host = config.host === '0.0.0.0' ? 'localhost' : config.host;

    console.info('Connect locally via http://' + host + ':' + config.port);
}

function loadParser() {
    new Parser();
}

function main() {
    console.info(`Initializing ${config.name} game engine...`);

    const webSocket = new WebSocket(config.host, config.port, config.gver);
    const database = new Database(config.database);
    const stdin = process.openStdin();

    webSocket.onConnect(connection => {
        if (world.allowConnections) {
            if (world.isFull()) {
                console.info(
                    'All the worlds are currently full. Please try again later.'
                );

                connection.sendUTF8('full');
                connection.close();
            } else world.playerConnectCallback(connection);
        } else {
            connection.sendUTF8('disallowed');
            connection.close();
        }
    });

    webSocket.onWebSocketReady(() => {
        /**
         * Initialize the world after we have finished loading
         * the websocket.
         */

        loadParser();

        world = new World(webSocket, database.getDatabase());

        world.load(onWorldLoad);
    });

    stdin.addListener('../../data', data => {
        const message = data.toString().replace(/(\r\n|\n|\r)/gm, '');
        const type = message.charAt(0);

        if (type !== '/') return;

        const blocks = message.substring(1).split(' ');
        const command = blocks.shift();

        if (!command) return;

        switch (command) {
            case 'players':
                console.info(
                    `There are a total of ${world.getPopulation()} player(s) logged in.`
                );

                break;

            case 'registered':
                world.database.registeredCount(count => {
                    console.info(`There are ${count} users registered.`);
                });

                break;

            case 'deleteGuilds':
                world.database.deleteGuilds();

                break;

            case 'kill':
                const username = blocks.join(' ');

                if (!world.playerInWorld(username)) {
                    console.info('Player is not logged in.');

                    return;
                }

                const player = world.getPlayerByName(username);

                if (!player) {
                    console.info('An error has occurred.');

                    return;
                }

                world.kill(player);

                break;

            case 'resetPositions':
                const newX = parseInt(blocks.shift());
                const newY = parseInt(blocks.shift());

                // x: 325, y: 87

                if (!newX || !newY) {
                    console.info(
                        'Invalid command parameters. Expected: /resetPositions <newX> <newY>'
                    );

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

                world.database.resetPositions(newX, newY, result => {
                    console.info(result);
                });

                break;

            case 'allowConnections':
                world.allowConnections = !world.allowConnections;

                if (world.allowConnections)
                    console.info('Server is now allowing connections.');
                else console.info('The server is not allowing connections.');

                break;
        }
    });
}

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function(str) {
        return str.length > 0 && this.substring(0, str.length) === str;
    };
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(str) {
        return (
            str.length > 0 &&
            this.substring(this.length - str.length, this.length) === str
        );
    };
}

main();
