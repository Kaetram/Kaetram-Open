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
}
