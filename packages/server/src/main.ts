import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import Database from './database/database';
import World from './game/world';
import SocketHandler from './network/sockethandler';
import Loader from './loader';

import type Connection from './network/connection';
import { reduce } from 'lodash';

class Main {
    private world?: World;
    private socketHandler = new SocketHandler();
    private database = new Database(config.database).getDatabase()!;

    public constructor() {
        log.info(`Initializing ${config.name} game engine...`);

        this.socketHandler.onReady(this.loadWorld.bind(this));
        this.socketHandler.onConnection(this.handleConnection.bind(this));

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
        if (this.world?.isFull()) {
            log.notice(`The world is currently full, connections are being rejected.`);
            connection.reject('worldfull');
            return;
        }

        this.world?.connectionCallback?.(connection);
    }
}

export default new Main();
