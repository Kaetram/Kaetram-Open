import { Db, MongoClient } from 'mongodb';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import Creator from './creator';
import Loader from './loader';

export default class MongoDB {
    public loader = new Loader(this);
    public creator = new Creator(this);

    private url: string;
    private connection!: Db;

    public constructor(
        host: string,
        port: number,
        username: string,
        password: string,
        private databaseName: string
    ) {
        let hasAuthentication = !!username && !!password;

        this.url = hasAuthentication
            ? `mongodb://${username}:${password}@${host}:${port}/${databaseName}`
            : `mongodb://${host}:${port}/${databaseName}`;
    }

    public async getConnection(): Promise<Db> {
        if (this.connection) return this.connection;

        let client = new MongoClient(this.url, { wtimeoutMS: 5 }),
            newClient = await client.connect().catch((error) => {
                log.error('Could not connect to MongoDB database.');
                log.error(`Error Info:`, error);
            });

        this.connection = newClient!.db(this.databaseName);

        return this.connection;
    }
}
