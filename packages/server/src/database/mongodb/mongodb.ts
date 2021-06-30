/* global module */

import _ from 'lodash';
import bcryptjs from 'bcryptjs';
import log from '../../util/log';
import config from '../../../config';
import { MongoClient, Db, MongoError } from 'mongodb';
import Loader from './loader';
import Creator from './creator';
import Player from '../../game/entity/character/player/player';

class MongoDB {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;

    loader: Loader;
    creator: Creator;

    connection: Db;

    constructor(host: string, port: number, user: string, password: string, database: string) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.database = database;

        this.loader = new Loader(this);
        this.creator = new Creator(this);

        this.connection = null;
    }

    public getConnection(callback: (connection: Db) => void): void {
        let url = `mongodb://${this.host}:${this.port}/${this.database}`;

        if (config.mongodbAuth)
            url = `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;

        let client: MongoClient = new MongoClient(url, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            writeConcern: {
                wtimeout: 5
            }
        });

        if (this.connection) {
            callback(this.connection);
            return;
        }

        client.connect((error: MongoError, newClient: MongoClient) => {
            if (error) {
                log.error('Could not connect to MongoDB database.');
                log.error(`Error Info: ${error}`);
                return;
            }

            this.connection = newClient.db(this.database);

            callback(this.connection);
        });
    }

    login(player: Player): void {
        this.getConnection((database) => {
            let dataCursor = database.collection('player_data').find({ username: player.username }),
                equipmentCursor = database
                    .collection('player_equipment')
                    .find({ username: player.username }),
                regionsCursor = database
                    .collection('player_regions')
                    .find({ username: player.username });

            dataCursor.toArray().then((playerData) => {
                equipmentCursor.toArray().then((equipmentData) => {
                    regionsCursor.toArray().then((regionData) => {
                        if (playerData.length === 0) this.register(player);
                        else {
                            let [ playerInfo ] = playerData,
                                [ equipmentInfo ] = equipmentData,
                                [ regions ] = regionData;
                                
                            playerInfo['armour'] = equipmentInfo.armour;
                            playerInfo['weapon'] = equipmentInfo.weapon;
                            playerInfo['pendant'] = equipmentInfo.pendant;
                            playerInfo['ring'] = equipmentInfo.ring;
                            playerInfo['boots'] = equipmentInfo.boots;

                            player.load(playerInfo);
                            player.loadRegions(regions);

                            player.intro();
                        }
                    });
                });
            });
        });
    }

    verify(player: Player, callback): void {
        this.getConnection((database) => {
            let dataCursor = database.collection('player_data').find({ username: player.username });

            dataCursor.toArray().then((data: any) => {
                if (data.length === 0) callback({ status: 'error' });
                else {
                    let info = data[0];

                    bcryptjs.compare(player.password, info.password, (error, result) => {
                        if (error) throw error;

                        if (result) callback({ status: 'success' });
                        else callback({ status: 'error' });
                    });
                }
            });
        });
    }

    register(player) {
        this.getConnection((database) => {
            let playerData = database.collection('player_data'),
                cursor = playerData.find({ username: player.username });

            cursor.toArray().then((info) => {
                if (info.length === 0) {
                    log.notice('No player data found for ' + player.username + '. Creating user.');

                    player.new = true;

                    player.load(Creator.getFullData(player));
                    player.intro();
                }
            });
        });
    }

    exists(player, callback) {
        this.getConnection((database) => {
            let playerData = database.collection('player_data'),
                emailCursor = playerData.find({ email: player.email }),
                usernameCursor = playerData.find({ username: player.username });

            log.debug('Looking for - ' + player.email + ' or ' + player.username);

            emailCursor.toArray().then((emailArray) => {
                if (emailArray.length === 0) {
                    usernameCursor.toArray().then((usernameArray) => {
                        if (usernameArray.length === 0) callback({ exists: false });
                        else callback({ exists: true, type: 'user' });
                    });
                } else callback({ exists: true, type: 'email' });
            });
        });
    }

    delete(player) {
        this.getConnection((database) => {
            let collections = [
                'player_data',
                'player_equipment',
                'player_inventory',
                'player_abilities',
                'player_bank',
                'player_quests',
                'player_achievements'
            ];

            _.each(collections, (col) => {
                let collection = database.collection(col);

                collection.deleteOne(
                    {
                        username: player.username
                    },
                    (error, result) => {
                        if (error) throw error;

                        if (result) log.notice('Player ' + player.username + ' has been deleted.');
                    }
                );
            });
        });
    }

    registeredCount(callback) {
        this.getConnection((database) => {
            let collection = database.collection('player_data');

            collection.countDocuments().then((count) => {
                callback(count);
            });
        });
    }

    resetPositions(newX, newY, callback) {
        this.getConnection((database) => {
            let collection = database.collection('player_data'),
                cursor = collection.find();

            cursor.toArray().then((playerList) => {
                _.each(playerList, (playerInfo: any) => {
                    delete playerInfo._id;

                    playerInfo.x = newX;
                    playerInfo.y = newY;

                    collection.updateOne(
                        {
                            username: playerInfo.username
                        },
                        { $set: playerInfo },
                        {
                            upsert: true
                        },
                        (error, result) => {
                            if (error) throw error;

                            if (result) callback('Successfully updated positions.');
                        }
                    );
                });
            });
        });
    }
}

export default MongoDB;
