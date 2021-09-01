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

    public async getConnection(): Promise<Db> {
        if (this.connection) return this.connection;

        let client = new MongoClient(this.url, { wtimeoutMS: 5 }),
            newClient = await client.connect().catch((error) => {
                log.error('Could not connect to MongoDB database.');
                log.error(`Error Info:`, error);
            });

        this.connection = newClient!.db(this.database);

        return this.connection;
    }

    public async login(player: Player): Promise<void> {
        let database = await this.getConnection(),
            dataCursor = database
                .collection<FullPlayerData>('player_data')
                .find({ username: player.username }),
            equipmentCursor = database
                .collection<PlayerEquipment>('player_equipment')
                .find({ username: player.username }),
            regionsCursor = database
                .collection<PlayerRegions>('player_regions')
                .find({ username: player.username }),
            [playerInfo] = await dataCursor.toArray();

        if (playerInfo) {
            let [equipmentInfo] = await equipmentCursor.toArray(),
                [regions] = await regionsCursor.toArray();

            playerInfo.armour = equipmentInfo.armour;
            playerInfo.weapon = equipmentInfo.weapon;
            playerInfo.pendant = equipmentInfo.pendant;
            playerInfo.ring = equipmentInfo.ring;
            playerInfo.boots = equipmentInfo.boots;

            player.load(playerInfo);
            player.loadRegions(regions);

            player.intro();
        } else this.register(player);
    }

    public async verify(player: Player): Promise<void> {
        let database = await this.getConnection(),
            dataCursor = database.collection('player_data').find({ username: player.username }),
            [info] = await dataCursor.toArray();

        return new Promise((resolve, reject) => {
            if (info)
                bcryptjs.compare(player.password, info.password, (error, result) => {
                    if (error) throw error;

                    if (result) resolve();
                    else reject();
                });
            else reject();
        });
    }

    public async register(player: Player): Promise<void> {
        let database = await this.getConnection(),
            playerData = database.collection('player_data'),
            cursor = playerData.find({ username: player.username }),
            [info] = await cursor.toArray();

        if (!info) {
            log.notice(`No player data found for ${player.username}. Creating user.`);

            player.new = true;

            player.load(Creator.getFullData(player));
            player.intro();
        }
    }

    public async exists(player: Player): Promise<{ exists: boolean; type?: string }> {
        let database = await this.getConnection(),
            playerData = database.collection('player_data'),
            emailCursor = playerData.find({ email: player.email }),
            usernameCursor = playerData.find({ username: player.username });

        log.debug(`Looking for - ${player.email} or ${player.username}`);

        let [email] = await emailCursor.toArray();
        if (email) return { exists: true, type: 'email' };

        let [username] = await usernameCursor.toArray();
        if (username) return { exists: true, type: 'user' };

        return { exists: false };
    }

    public async delete(player: Player): Promise<void> {
        let database = await this.getConnection(),
            collections = [
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

            collection.deleteOne({ username: player.username }, (error, result) => {
                if (error) throw error;

                if (result) log.notice(`Player ${player.username} has been deleted.`);
            });
        });
    }

    public async registeredCount(callback: (count: number) => void): Promise<void> {
        let database = await this.getConnection(),
            collection = database.collection('player_data'),
            count = await collection.countDocuments();

        callback(count);
    }

    public async resetPositions(
        newX: number,
        newY: number,
        callback: (status: string) => void
    ): Promise<void> {
        let database = await this.getConnection(),
            collection = database.collection('player_data'),
            cursor = collection.find(),
            playerList = await cursor.toArray();

        _.each(playerList, (playerInfo) => {
            delete playerInfo._id;

            playerInfo.x = newX;
            playerInfo.y = newY;

            collection.updateOne(
                { username: playerInfo.username },
                { $set: playerInfo },
                { upsert: true },
                (error, result) => {
                    if (error) throw error;

                    if (result) callback('Successfully updated positions.');
                }
            );
        });
    }
}
