import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import Database from './database/database';
import World from './game/world';
import SocketHandler from './network/sockethandler';
import Loader from './loader';

import type Connection from './network/connection';
import { exit } from 'process';

class Main {
    private world?: World;
    private socketHandler = new SocketHandler();
    private database = new Database(config.database).getDatabase()!;

    private ready = false;

    public constructor() {
        log.info(`Initializing ${config.name} game engine...`);

        this.socketHandler.onConnection(this.handleConnection.bind(this));

        this.database.onReady(this.handleReady.bind(this));
        this.database.onFail(this.handleFail.bind(this));

        new Loader();
    }

    /**
     * Initialize the world. The world is an abstraction of where
     * the players will be in. Here we keep track of all players,
     * entities, and events. The world has direct access to the database
     * and it is responsible for saving, loading, and updating the database.
     */

    private loadWorld(): void {
        log.info(`************** ${config.name} World **************`);

        this.world = new World(this.socketHandler, this.database);
    }

    /**
     * We handle each new connection here. We check if the world is full,
     * and if there is room, we make a callback in the world to handle the rest.
     * @param connection The new connection we received from the WebSocket.
     */
    private handleConnection(connection: Connection): void {
        if (!this.ready) {
            connection.reject('disallowed');
            return;
        }

        if (this.world?.isFull()) {
            log.notice(`The world is currently full, connections are being rejected.`);
            connection.reject('worldfull');
            return;
        }

        this.world?.connectionCallback?.(connection);
    }

    /**
     * The handle ready callback function for when the database finishes initializing.
     * @param withoutDatabase Boolean if to display logs that we are running without database.
     */

    private handleReady(withoutDatabase = false): void {
        this.ready = true;

        this.loadWorld();

        if (withoutDatabase)
            log.notice('Running without database - Server is now accepting connections.');
    }

    /**
     * The failure handler if the database does not establish connection.
     * @param error Error message from the database.
     */

    private handleFail(error: Error): void {
        // Proceed with no database and allow connections.
        if (config.skipDatabase) return this.handleReady(true);

        log.critical('Could not connect to the MongoDB server.');
        log.critical(`Error: ${error}`);

        // Exit the process.
        exit(1);
    }
}

export default new Main();
