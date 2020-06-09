/* global module */

import _ from 'underscore';
import bcrypt from 'bcrypt';
import { MongoClient, Db } from 'mongodb';
import Loader from './loader';
import Creator from './creator';

class MongoDB {

    host: string;
    port: number;
    user: string;
    password: string;
    database: string;

    loader: Loader;
    creator: Creator;

    connection: Db;

    constructor(host, port, user, password, database) {

        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.database = database;

        this.loader = new Loader(this);
        this.creator = new Creator(this);

        this.connection = null;
    }

    getDatabase(callback, type?) {
        let url = `mongodb://${this.host}:${this.port}/${this.database}`;

            if (config.mongoAuth)
                url = `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;

            let client = new MongoClient(url, {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                wtimeout: 5
            });

        if (this.connection) {
            callback(this.connection);
            return;
        }

        client.connect((error, newClient) => {
            if (error) {
                log.error('Could not connect to MongoDB database.');
                log.error(`Error Info: ${error}`);
                return;
            }

            this.connection = newClient.db(this.database);

            callback(this.connection);
        });

    }

    login(player) {

        this.getDatabase((database) => {
            let dataCursor = database.collection('player_data').find({ username: player.username }),
                equipmentCursor = database.collection('player_equipment').find({ username: player.username }),
                regionsCursor = database.collection('player_regions').find({ username: player.username });

            dataCursor.toArray().then((playerData) => {
                equipmentCursor.toArray().then((equipmentData) => {
                    regionsCursor.toArray().then((regionData) => {

                        if (playerData.length === 0)
                            this.register(player);
                        else {
                            let playerInfo = playerData[0],
                                equipmentInfo = equipmentData[0],
                                regions = regionData[0];

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
            })
        });
    }

    verify(player, callback) {

        this.getDatabase((database) => {
            let dataCursor = database.collection('player_data').find({ username: player.username });

            dataCursor.toArray().then((data) => {
                if (data.length === 0)
                    callback({ status: 'error' });
                else {
                    let info = data[0];

                    bcrypt.compare(player.password, info.password, (error, result) => {
                        if (error) throw error;

                        if (result)
                            callback({ status: 'success' });
                        else
                            callback({ status: 'error' });
                    });
                }
            })
        });
    }

    register(player) {

        this.getDatabase((database) => {
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

        this.getDatabase((database) => {
            let playerData = database.collection('player_data'),
                emailCursor = playerData.find({ email: player.email }),
                usernameCursor = playerData.find({ username: player.username });

            log.debug('Looking for - ' + player.email +' or ' + player.username);

            emailCursor.toArray().then((emailArray) => {
                if (emailArray.length === 0) {
                    usernameCursor.toArray().then((usernameArray) => {
                        if (usernameArray.length === 0)
                            callback({ exists: false });
                        else
                            callback({ exists: true, type: 'user' });
                    });
                } else
                    callback({ exists: true, type: 'email' });
            });
        });
    }

    delete(player) {

        this.getDatabase((database) => {
            let collections = ['player_data', 'player_equipment', 'player_inventory', 'player_abilities', 'player_bank', 'player_quests', 'player_achievements'];

            _.each(collections, (col) => {
                let collection = database.collection(col);

                collection.deleteOne({
                    username: player.username
                }, (error, result) => {
                    if (error) throw error;

                    if (result)
                        log.notice('Player ' + player.username + ' has been deleted.')
                })
            });
        });
    }

    registeredCount(callback) {

        this.getDatabase((database) => {
            let collection = database.collection('player_data');

            collection.countDocuments().then((count) => {
                callback(count);
            });

        });
    }

    resetPositions(newX, newY, callback) {

        this.getDatabase((database) => {
            let collection = database.collection('player_data'),
                cursor = collection.find();

            cursor.toArray().then((playerList) => {
                _.each(playerList, (playerInfo: any) => {
                    delete playerInfo._id;

                    playerInfo.x = newX;
                    playerInfo.y = newY;

                    collection.updateOne({
                        username: playerInfo.username
                    }, { $set: playerInfo }, {
                        upsert: true
                    }, (error, result) => {
                        if (error)
                            throw error;

                        if (result)
                            callback('Successfully updated positions.');
                    });
                });
            });
        });
    }

}

export default MongoDB;
