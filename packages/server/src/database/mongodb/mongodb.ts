import bcryptjs from 'bcryptjs';
import _ from 'lodash';
import { Db, MongoClient } from 'mongodb';

import log from '@kaetram/common/util/log';

import Creator, { FullPlayerData, PlayerData } from './creator';
import Loader from './loader';

import type Player from '../../game/entity/character/player/player';
import type { PlayerEquipment, PlayerRegions } from '../../game/entity/character/player/player';
import config from '@kaetram/common/config';

export default class MongoDB {
    private connectionUrl: string;

    private database!: Db;

    public loader?: Loader;
    public creator?: Creator;

    public readyCallback?: () => void;
    public failCallback?: (error: Error) => void;

    public constructor(
        host: string,
        port: number,
        username: string,
        password: string,
        private databaseName: string
    ) {
        let hasAuthentication = !!username && !!password;

        this.connectionUrl = hasAuthentication
            ? `mongodb://${username}:${password}@${host}:${port}/${databaseName}`
            : `mongodb://${host}:${port}/${databaseName}`;

        this.createConnection();
    }

    /**
     * Attempts to connect to MongoDB. Times out after 10 seconds if
     * no MongoDB server is present for the given host.
     */

    private createConnection(): void {
        let client = new MongoClient(this.connectionUrl, {
            connectTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000,
            wtimeoutMS: 10
        });

        client.connect((error: Error | undefined, _client: MongoClient | undefined) => {
            if (error) return this.failCallback?.(error);

            this.database = _client!.db(this.databaseName);

            log.notice('Successfully connected to the MongoDB server.');

            this.readyCallback?.();

            this.loader = new Loader(this.database);
            this.creator = new Creator(this.database);
        });
    }

    /**
     * Takes the player's username and extracts the data from the server. Checks
     * the password and creates a callback if an error is present.
     * @param player The player object to extract password and username from.
     * @param callback The UTF8 string for the connection to be rejected with.
     */

    public login(player: Player): void {
        if (!this.hasDatabase()) return;

        let cursor = this.database
            .collection<PlayerData>('player_data')
            .find({ username: player.username });

        cursor.toArray().then((playerData) => {
            if (playerData.length === 0) player.connection.reject('invalidlogin');
            else {
                let [info] = playerData;

                bcryptjs.compare(player.password, info.password, (error: Error, result) => {
                    if (error) throw error;

                    if (result) player.load(info);
                    else player.connection.reject('invalidlogin');
                });
            }
        });
    }

    public register(player: Player): void {
        if (!this.hasDatabase()) return;

        let collection = this.database.collection<PlayerData>('player_data'),
            usernameCursor = collection.find({ username: player.username }),
            emailCursor = collection.find({ email: player.email });

        emailCursor.toArray().then((emailData) => {
            if (emailData.length > 0) return player.connection.reject('emailexists');

            usernameCursor.toArray().then((playerData) => {
                if (playerData.length > 0) return player.connection.reject('userexists');

                log.debug(`No player data found for ${player.username}, creating user.`);

                player.load(Creator.getFullData(player));
            });
        });
    }

    /**
     * Checks the amount of players registered and returns it in the form of a callback.
     * @param callback Returns the number of players registered.
     */

    public registeredCount(callback: (count: number) => void): void {
        if (!this.hasDatabase()) return;

        let collection = this.database.collection('player_data');

        collection.countDocuments().then((count) => {
            callback(count);
        });
    }

    /**
     * Checks whether or not a connection has been established.
     * @returns If the database element is present.
     */

    private hasDatabase(): boolean {
        if (!this.database) log.error('No connection established for the database.');

        return !!this.database;
    }

    /**
     * Callback signal if connection is successfully established.
     */

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }

    /**
     * Callback for connection failure.
     */

    public onFail(callback: (error: Error) => void): void {
        this.failCallback = callback;
    }
}
