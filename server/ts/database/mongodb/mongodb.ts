import * as bcrypt from 'bcrypt';
import { MongoClient, Db } from 'mongodb';
import * as _ from 'underscore';
import config from '../../../config';
import Creator from './creator';
import Loader from './loader';
import Player from '../../game/entity/character/player/player';

/**
 * Creates and initializes a MongoDB client.
 */
class MongoDB {
    public connection: Db;

    public loader: Loader;

    public creator: Creator;

    /**
     * Creates an instance of MongoDB.
     * @param host - The network host name for the database to connect to.
     * @param port - The network port number for the database to connect to.
     * @param user - The username data for the MongoDB database.
     * @param password - The password for the MongoDB database.
     * @param database - The name of the database to connect to.
     */
    constructor(
        public host: string,
        public port: string | number,
        public user: string,
        public password: string,
        public database: string
    ) {
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
        this.getDatabase((database) => {
            const dataCursor = database
                .collection('player_data')
                .find({ username: player.username });
            const equipmentCursor = database
                .collection('player_equipment')
                .find({ username: player.username });
            const regionsCursor = database
                .collection('player_regions')
                .find({ username: player.username });

            dataCursor.toArray().then((playerData) => {
                equipmentCursor.toArray().then((equipmentData) => {
                    regionsCursor.toArray().then((regionData) => {
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
        this.getDatabase((database) => {
            const dataCursor = database
                .collection('player_data')
                .find({ username: player.username });

            dataCursor.toArray().then((data) => {
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

    register(player: Player) {
        this.getDatabase((database) => {
            const playerData = database.collection('player_data');
            const cursor = playerData.find({ username: player.username });

            cursor.toArray().then((info) => {
                if (info.length === 0) {
                    console.info(
                        `No player data found for ${player.username}. Creating user.`
                    );

                    player.new = true;

                    player.load(Creator.getFullData(player));
                    player.intro();
                }
            });
        });
    }

    exists(player, callback) {
        this.getDatabase((database) => {
            const playerData = database.collection('player_data');
            const emailCursor = playerData.find({ email: player.email });
            const usernameCursor = playerData.find({
                username: player.username
            });

            console.info(`Looking for - ${player.email} or ${player.username}`);

            emailCursor.toArray().then((emailArray) => {
                if (emailArray.length === 0) {
                    usernameCursor.toArray().then((usernameArray) => {
                        if (usernameArray.length === 0)
                            callback({ exists: false });
                        else callback({ exists: true, type: 'user' });
                    });
                } else callback({ exists: true, type: 'email' });
            });
        });
    }

    delete(player) {
        this.getDatabase((database) => {
            const collections = [
                'player_data',
                'player_equipment',
                'player_inventory',
                'player_abilities',
                'player_bank',
                'player_quests',
                'player_achievements'
            ];

            _.each(collections, (col) => {
                const collection = database.collection(col);

                collection.deleteOne(
                    {
                        username: player.username
                    },
                    (error, result) => {
                        if (error) throw error;

                        if (result)
                            console.info(
                                `Player ${player.username} has been deleted.`
                            );
                    }
                );
            });
        });
    }

    registeredCount(callback) {
        this.getDatabase((database) => {
            const collection = database.collection('player_data');

            collection.countDocuments().then((count) => {
                callback(count);
            });
        });
    }

    resetPositions(newX, newY, callback) {
        this.getDatabase((database) => {
            const collection = database.collection('player_data');
            const cursor = collection.find();

            cursor.toArray().then((playerList) => {
                _.each(playerList, (playerInfo: any) => {
                    // eslint-disable-next-line no-underscore-dangle
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
            _.each(guilds, (guild: any) => {
                collection.deleteOne({ name: guild.name });
            });
        }, true);
    }
}

export default MongoDB;
