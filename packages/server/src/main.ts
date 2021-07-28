import config from '../config';
import Database from './database/database';
import MongoDB from './database/mongodb/mongodb';
import Player from './game/entity/character/player/player';
import World from './game/world';
import Connection from './network/connection';
import SocketHandler from './network/sockethandler';
import log from './util/log';
import Parser from './util/parser';

class Main {
    socketHandler: SocketHandler;
    database: MongoDB;
    parser: Parser;
    world: World;

    constructor() {
        log.info('Initializing ' + config.name + ' game engine...');

        this.socketHandler = new SocketHandler();
        this.database = new Database(config.database).getDatabase()!;
        this.parser = new Parser();
        this.world = null!;

        this.socketHandler.onReady(() => {
            /**
             * Initialize the world after we have finished loading
             * the websocket.
             */

            const onWorldLoad = () => {
                log.notice('World has successfully been created.');

                if (!config.allowConnectionsToggle) this.world.allowConnections = true;

                const host = config.host === '0.0.0.0' ? 'localhost' : config.host;

                log.notice('Connect locally via http://' + host + ':' + config.socketioPort);
            };

            this.world = new World(this.socketHandler, this.database);

            this.world.load(onWorldLoad);
        });

        this.socketHandler.onConnection((connection: Connection) => {
            if (this.world.allowConnections)
                if (this.world.isFull()) {
                    log.info('All the worlds are currently full. Please try again later.');

                    connection.sendUTF8('full');
                    connection.close();
                } else this.world.playerConnectCallback?.(connection);
            else {
                connection.sendUTF8('disallowed');
                connection.close();
            }
        });

        this.loadConsole();
    }

    private loadConsole(): void {
        const stdin = process.openStdin();

        stdin.addListener('data', (data: Buffer) => {
            const message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
                type = message.charAt(0);

            if (type !== '/') return;

            const blocks = message.slice(1).split(' '),
                command = blocks.shift()!;

            if (!command) return;

            let username: string,
                player: Player,
                newX: number,
                newY: number,
                itemId: number,
                itemCount: number;

            switch (command) {
                case 'players':
                    log.info(`There are a total of ${this.getPopulation()} player(s) logged in.`);

                    break;

                case 'registered':
                    this.database.registeredCount((count) => {
                        log.info(`There are ${count} users registered.`);
                    });

                    break;

                case 'kill':
                    username = blocks.join(' ');

                    if (!this.world.isOnline(username)) {
                        log.info('Player is not logged in.');
                        return;
                    }

                    player = this.world.getPlayerByName(username);

                    if (!player) {
                        log.info('An error has occurred.');
                        return;
                    }

                    this.world.kill(player);

                    break;

                case 'resetPositions':
                    newX = parseInt(blocks.shift()!);
                    newY = parseInt(blocks.shift()!);

                    // x: 325, y: 87

                    if (!newX || !newY) {
                        log.info(
                            'Invalid command parameters. Expected: /resetPositions <newX> <newY>'
                        );
                        return;
                    }

                    /**
                     * We are iterating through all of the users in the database
                     * and resetting their position to the parameters inputted.
                     * This is to be used when doing some game-breaking map
                     * updates. This command is best used in tandem with the
                     * `allowConnectionsToggle` to prevent users from logging
                     * in.
                     */

                    this.database.resetPositions(newX, newY, (result) => {
                        log.info(result);
                    });

                    break;

                case 'allowConnections':
                    this.world.allowConnections = !this.world.allowConnections;

                    if (this.world.allowConnections)
                        log.info('Server is now allowing connections.');
                    else log.info('The server is not allowing connections.');

                    break;

                case 'give':
                    itemId = parseInt(blocks.shift()!);
                    itemCount = parseInt(blocks.shift()!);

                    username = blocks.join(' ');

                    player = this.world.getPlayerByName(username);

                    if (!player) return;

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

    getPopulation(): number {
        return this.world.getPopulation();
    }
}

export default new Main();
