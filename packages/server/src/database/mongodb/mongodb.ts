import bcryptjs from 'bcryptjs';
import _ from 'lodash';
import { Db, MongoClient } from 'mongodb';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import Creator, { FullPlayerData } from './creator';
import Loader from './loader';

import type Player from '../../game/entity/character/player/player';
import type { PlayerEquipment, PlayerRegions } from '../../game/entity/character/player/player';

export default class MongoDB {
    public loader = new Loader(this);
    public creator = new Creator(this);

    private url: string;
    private connection!: Db;

    public constructor(
        host: string,
        port: number,
        user: string,
        password: string,
        private database: string
    ) {
        let { mongodbAuth, mongodbSrv } = config;

        this.url = mongodbSrv
            ? mongodbAuth
                ? `mongodb+srv://${user}:${password}@${host}/${database}`
                : `mongodb+srv://${host}/${database}`
            : mongodbAuth
            ? `mongodb://${user}:${password}@${host}:${port}/${database}`
            : `mongodb://${host}:${port}/${database}`;
    }

    public getConnection(callback: (connection: Db) => void): void {
        if (this.connection) return callback(this.connection);

        let client = new MongoClient(this.url, { wtimeoutMS: 5 });

        client.connect((error, newClient) => {
            if (error) {
                log.error('Could not connect to MongoDB database.');
                log.error(`Error Info: ${error}`);
                return;
            }

            this.connection = newClient!.db(this.database);

            callback(this.connection);
        });
    }

    public login(player: Player): void {
        this.getConnection((database) => {
            let dataCursor = database
                    .collection<FullPlayerData>('player_data')
                    .find({ username: player.username }),
                equipmentCursor = database
                    .collection<PlayerEquipment>('player_equipment')
                    .find({ username: player.username }),
                regionsCursor = database
                    .collection<PlayerRegions>('player_regions')
                    .find({ username: player.username });

            dataCursor.toArray().then((playerData) => {
                equipmentCursor.toArray().then((equipmentData) => {
                    regionsCursor.toArray().then((regionData) => {
                        if (playerData.length === 0) this.register(player);
                        else {
                            let [playerInfo] = playerData,
                                [equipmentInfo] = equipmentData,
                                [regions] = regionData;

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

    public verify(player: Player, callback: (data: { status: 'success' | 'error' }) => void): void {
        this.getConnection((database) => {
            let dataCursor = database.collection('player_data').find({ username: player.username });

            dataCursor.toArray().then((data) => {
                if (data.length === 0) callback({ status: 'error' });
                else {
                    let [info] = data;

                    bcryptjs.compare(player.password, info.password, (error, result) => {
                        if (error) throw error;

                        if (result) callback({ status: 'success' });
                        else callback({ status: 'error' });
                    });
                }
            });
        });
    }

    public register(player: Player): void {
        this.getConnection((database) => {
            let playerData = database.collection('player_data'),
                cursor = playerData.find({ username: player.username });

            cursor.toArray().then((info) => {
                if (info.length === 0) {
                    log.notice(`No player data found for ${player.username}. Creating user.`);

                    player.new = true;

                    player.load(Creator.getFullData(player));
                    player.intro();
                }
            });
        });
    }

    public exists(
        player: Player,
        callback: (data: { exists: boolean; type?: string }) => void
    ): void {
        this.getConnection((database) => {
            let playerData = database.collection('player_data'),
                emailCursor = playerData.find({ email: player.email }),
                usernameCursor = playerData.find({ username: player.username });

            log.debug(`Looking for - ${player.email} or ${player.username}`);

            emailCursor.toArray().then((emailArray) => {
                if (emailArray.length === 0)
                    usernameCursor.toArray().then((usernameArray) => {
                        if (usernameArray.length === 0) callback({ exists: false });
                        else callback({ exists: true, type: 'user' });
                    });
                else callback({ exists: true, type: 'email' });
            });
        });
    }

    public delete(player: Player): void {
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

                        if (result) log.notice(`Player ${player.username} has been deleted.`);
                    }
                );
            });
        });
    }

    public registeredCount(callback: (count: number) => void): void {
        this.getConnection((database) => {
            let collection = database.collection('player_data');

            collection.countDocuments().then((count) => {
                callback(count);
            });
        });
    }

    public resetPositions(newX: number, newY: number, callback: (status: string) => void): void {
        this.getConnection((database) => {
            let collection = database.collection('player_data'),
                cursor = collection.find();

            cursor.toArray().then((playerList) => {
                _.each(playerList, (playerInfo) => {
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
