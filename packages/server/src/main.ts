import { exit } from 'node:process';

import Console from './console';
import World from './game/world';
import Loader from './info/loader';
import SocketHandler from './network/sockethandler';
import Args from './args';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Database from '@kaetram/common/database/database';

import type Connection from './network/connection';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';

class Main {
    private world?: World;
    private socketHandler: SocketHandler = new SocketHandler();
    private database: MongoDB = new Database(config.database).getDatabase()!;

    private ready = false;

    public constructor(private params: string[] = process.argv) {
        if (!this.handleLicensing()) return;

        log.info(`Initializing ${config.name} game engine...`);

        this.socketHandler.onConnection(this.handleConnection.bind(this));

        this.database.onReady(this.handleReady.bind(this));
        this.database.onFail(this.handleFail.bind(this));

        if (!config.debugging) process.on('SIGINT', this.handleSignalInterrupt.bind(this));

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

        new Console(this.world);
    }

    /**
     * We handle each new connection here. We check if the world is full,
     * and if there is room, we make a callback in the world to handle the rest.
     * @param connection The new connection we received from the WebSocket.
     */
    private handleConnection(connection: Connection): void {
        if (!this.ready || !this.world?.allowConnections) {
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

        log.notice(`Server is now listening on port: ${config.port}.`);
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

        log.info(`Attempting to reconnect in 10 seconds...`);

        setTimeout(() => this.database.createConnection(), 10_000);
    }

    /**
     * Occurs when CTRL+C is pressed and the process is asked to end.
     */

    private handleSignalInterrupt(): void {
        // Prevent process from closing immediately.
        process.stdin.resume();

        log.info(`Saving all players and closing process...`);

        // Save all players
        this.world?.save();

        log.info(`Shutting down Kaetram game engine.`);

        // Actually exit the process.
        setTimeout(() => exit(0), 2000);
    }

    /**
     * Ensures that the license agreements have been accepted before
     * starting the server.
     */

    private handleLicensing(): boolean {
        if (!config.acceptLicense) {
            log.critical(
                `You must read and accept both MPL2.0 and OPL licensing agreements. Once you've done so, toggle ACCEPT_LICENSE in your environment variables.`
            );

            return false;
        }

        return true;
    }
}

// Parse the override arguments.
new Args();

export default new Main();
