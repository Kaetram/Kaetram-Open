import Creator from './creator';
import Loader from './loader';

import Quests from '../../../data/quests.json';

import { Modules } from '@kaetram/common/network';
import Filter from '@kaetram/common/util/filter';
import log from '@kaetram/common/util/log';
import bcryptjs from 'bcryptjs';
import _ from 'lodash';
import { MongoClient } from 'mongodb';

import type { Db } from 'mongodb';
import type Player from '../../game/entity/character/player/player';
import type { PlayerInfo } from './creator';

export default class MongoDB {
    private connectionUrl: string;

    private database!: Db;

    public loader!: Loader;
    public creator!: Creator;

    public readyCallback?: () => void;
    public failCallback?: (error: Error) => void;

    public constructor(
        host: string,
        port: number,
        username: string,
        password: string,
        private databaseName: string,
        private tls: boolean,
        srv: boolean
    ) {
        let srvInsert = srv ? 'mongodb+srv' : 'mongodb',
            authInsert = username && password ? `${username}:${password}@` : '',
            portInsert = port > 0 ? `:${port}` : '';
        this.connectionUrl = `${srvInsert}://${authInsert}${host}${portInsert}/${databaseName}`;

        // Attempt to connect to MongoDB.
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
            wtimeoutMS: 10,
            tls: this.tls
        });

        client.connect((error: Error | undefined, _client: MongoClient | undefined) => {
            if (error) {
                // Initializes an empty loader controller.
                this.loader = new Loader();
                return this.failCallback?.(error);
            }

            this.database = _client!.db(this.databaseName);

            this.loader = new Loader(this.database);
            this.creator = new Creator(this.database);

            this.readyCallback?.();

            log.notice('Successfully connected to the MongoDB server.');
        });
    }

    /**
     * Takes the player's username and extracts the data from the server. Checks
     * the password and creates a callback if an error is present.
     * @param player The player object to extract password and username from.
     */

    public login(player: Player): void {
        if (!this.hasDatabase()) return;

        let cursor = this.database
            .collection<PlayerInfo>('player_info')
            .find({ username: player.username });

        cursor.toArray().then((playerInfo) => {
            // Reject if we cannot find any data about the player.
            if (playerInfo.length === 0) player.connection.reject('invalidlogin');
            else {
                let [info] = playerInfo;

                bcryptjs.compare(player.password, info.password, (error: Error, result) => {
                    if (error) throw error;

                    // Reject if password hashes don't match.
                    if (result) player.load(info);
                    else player.connection.reject('invalidlogin');
                });
            }
        });
    }

    /**
     * Creates a new user and adds it to the database.
     * @param player Basic information about the player such as username, password, and email.
     */

    public register(player: Player): void {
        if (!this.hasDatabase()) return;

        // Verify account credentials for input validity and ensure username isn't profane.
        if (!Creator.verifyPlayer(player) || Filter.isProfane(player.username))
            return player.connection.reject('invalidinput');

        let collection = this.database.collection<PlayerInfo>('player_info'),
            usernameCursor = collection.find({ username: player.username }),
            emailCursor = collection.find({ email: player.email });

        // Check if email exists.
        emailCursor.toArray().then((emailData) => {
            // If email exists and is specified by player, we check database for duplicates and reject if that's the case.
            if (emailData.length > 0 && player.email !== '')
                return player.connection.reject('emailexists');

            // Check if username exists.
            usernameCursor.toArray().then((playerInfo) => {
                // User exists and so we reject instead of double registering.
                if (playerInfo.length > 0) return player.connection.reject('userexists');

                log.debug(`No player data found for ${player.username}, creating user.`);

                player.statistics.creationTime = Date.now();

                player.load(Creator.serializePlayer(player));
            });
        });
    }

    /**
     * Checks whether or not the username exists in the database.
     * @param username The username to check for.
     * @param callback Contains the result of the check.
     */

    public exists(username: string, callback: (exists: boolean) => void): void {
        if (!this.hasDatabase()) return;

        let cursor = this.database.collection('player_info').find({ username });

        cursor.toArray().then((playerInfo) => {
            callback(playerInfo.length > 0);
        });
    }

    /**
     * Iterates through all the players in the database and (depending on their
     * tutorial quest progress) resets their positions to the defaults.
     */

    public resetPositions(): void {
        if (!this.hasDatabase()) return;

        let infoCollection = this.database.collection('player_info'),
            questsCollection = this.database.collection('player_quests'),
            tutorialQuest = Quests.tutorial;

        if (!tutorialQuest) return log.warning('No tutorial quest found.');

        // Extract the number of stages from the tutorial quest.
        let tutorialLength = Object.keys(tutorialQuest.stages).length;

        infoCollection
            .find({})
            .toArray()
            .then((playerInfo) => {
                _.each(playerInfo, (info) => {
                    questsCollection.findOne({ username: info.username }).then((questInfo) => {
                        if (!questInfo || info.username !== questInfo.username) return;

                        /**
                         * We check the player's tutorial progress and determine whether
                         * to use the default spawn position or the tutorial spawn position.
                         */

                        let { quests } = questInfo,
                            tutorial = _.find(quests, { key: 'tutorial' }),
                            inTutorial = !tutorial || tutorial.stage < tutorialLength,
                            location = (
                                inTutorial
                                    ? Modules.Constants.TUTORIAL_SPAWN_POINT
                                    : Modules.Constants.SPAWN_POINT
                            ).split(','),
                            position = {
                                x: parseFloat(location[0]),
                                y: parseFloat(location[1])
                            };

                        // Update the position parameters.
                        info.x = position.x;
                        info.y = position.y;

                        // Insert the new position into the player's database entry.
                        infoCollection.updateOne(
                            { username: info.username },
                            {
                                $set: {
                                    x: position.x,
                                    y: position.y
                                }
                            },
                            { upsert: true }
                        );
                    });
                });
            });
    }

    /**
     * Checks the amount of players registered and returns it in the form of a callback.
     * @param callback Returns the number of players registered.
     */

    public registeredCount(callback: (count: number) => void): void {
        if (!this.hasDatabase()) return;

        let collection = this.database.collection('player_info');

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
