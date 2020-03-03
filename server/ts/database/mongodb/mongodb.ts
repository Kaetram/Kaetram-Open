/** @format */

import { MongoClient } from 'mongodb';
import Loader from './loader';
import Creator from './creator';
import bcrypt from 'bcrypt';
import _ from 'underscore';
import config from '../../../config.json';

class MongoDB {
    public host: any;
    public port: any;
    public database: any;
    public user: any;
    public password: any;
    public connection: any;
    public loader: any;
    creator: Creator;

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
        let URL = `mongodb://${this.host}:${this.port}/${this.database}`;

        if (config.mongoAuth)
            URL = `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;

        const client = new MongoClient(URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            wtimeout: 5
        });

        if (this.connection) {
            callback(this.connection);

            return;
        }

        client.connect((error, newClient) => {
            if (error) throw error;

            this.connection = newClient.db(this.database);

            callback(this.connection);
        });
    }

    login(player) {
        this.getDatabase(database => {
            const dataCursor = database
                .collection('player_data')
                .find({ username: player.username });
            const equipmentCursor = database
                .collection('player_equipment')
                .find({ username: player.username });
            const regionsCursor = database
                .collection('player_regions')
                .find({ username: player.username });

            dataCursor.toArray().then(playerData => {
                equipmentCursor.toArray().then(equipmentData => {
                    regionsCursor.toArray().then(regionData => {
                        if (playerData.length === 0) this.register(player);
                        else {
                            const playerInfo = playerData[0];
                            const equipmentInfo = equipmentData[0];
                            const regions = regionData[0];

                            playerInfo.armour = equipmentInfo.armour;
                            playerInfo.weapon = equipmentInfo.weapon;
                            playerInfo.pendant = equipmentInfo.pendant;
                            playerInfo.ring = equipmentInfo.ring;
                            playerInfo.boots = equipmentInfo.boots;

                            player.load(playerInfo);
                            player.loadRegions(regions);

                            player.intro();
                        }
                    });
                });
            });
        });
    }

    verify(player, callback) {
        this.getDatabase(database => {
            const dataCursor = database
                .collection('player_data')
                .find({ username: player.username });

            dataCursor.toArray().then(data => {
                if (data.length === 0) callback({ status: 'error' });
                else {
                    const info = data[0];

                    bcrypt.compare(
                        player.password,
                        info.password,
                        (error, result) => {
                            if (error) throw error;

                            if (result) callback({ status: 'success' });
                            else callback({ status: 'error' });
                        }
                    );
                }
            });
        });
    }

    register(player) {
        this.getDatabase(database => {
            const playerData = database.collection('player_data');
            const cursor = playerData.find({ username: player.username });

            cursor.toArray().then(info => {
                if (info.length === 0) {
                    console.info(
                        'No player data found for ' +
                            player.username +
                            '. Creating user.'
                    );

                    player.new = true;

                    player.load(Creator.getFullData(player));
                    player.intro();
                }
            });
        });
    }

    exists(player, callback) {
        this.getDatabase(database => {
            const playerData = database.collection('player_data');
            const emailCursor = playerData.find({ email: player.email });
            const usernameCursor = playerData.find({
                username: player.username
            });

            console.info(
                'Looking for - ' + player.email + ' or ' + player.username
            );

            emailCursor.toArray().then(emailArray => {
                if (emailArray.length === 0) {
                    usernameCursor.toArray().then(usernameArray => {
                        if (usernameArray.length === 0)
                            callback({ exists: false });
                        else callback({ exists: true, type: 'user' });
                    });
                } else callback({ exists: true, type: 'email' });
            });
        });
    }

    delete(player) {
        this.getDatabase(database => {
            const collections = [
                'player_data',
                'player_equipment',
                'player_inventory',
                'player_abilities',
                'player_bank',
                'player_quests',
                'player_achievements'
            ];

            _.each(collections, col => {
                const collection = database.collection(col);

                collection.deleteOne(
                    {
                        username: player.username
                    },
                    (error, result) => {
                        if (error) throw error;

                        if (result)
                            console.info(
                                'Player ' +
                                    player.username +
                                    ' has been deleted.'
                            );
                    }
                );
            });
        });
    }

    registeredCount(callback) {
        this.getDatabase(database => {
            const collection = database.collection('player_data');

            collection.countDocuments().then(count => {
                callback(count);
            });
        });
    }

    resetPositions(newX, newY, callback) {
        this.getDatabase(database => {
            const collection = database.collection('player_data');
            const cursor = collection.find();

            cursor.toArray().then(playerList => {
                _.each(playerList, playerInfo => {
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

                            if (result)
                                callback('Successfully updated positions.');
                        }
                    );
                });
            });
        });
    }

    /* Primarily for debugging or should something go wrong. */

    deleteGuilds() {
        this.loader.getGuilds((guilds, collection) => {
            _.each(guilds, guild => {
                collection.deleteOne({ name: guild.name });
            });
        }, true);
    }
}

export default MongoDB;
