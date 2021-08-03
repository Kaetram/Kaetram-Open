import { Db, MongoClient } from 'mongodb';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import Creator from './creator';
import Loader from './loader';

export default class MongoDB {
    public loader = new Loader(this);
    public creator = new Creator(this);

    private connection!: Db;

    public constructor(
        public host: string,
        public port: number,
        public user: string,
        public password: string,
        public database: string
    ) {
        log.info('Successfully initialized MongoDB.');
    }

    public async getDatabase(): Promise<Db> {
        let url = `mongodb://${this.host}:${this.port}/${this.database}`;

        if (config.mongodbAuth)
            url = `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;

        let client = new MongoClient(url, {
            wtimeoutMS: 5
        });

        return new Promise((resolve, reject) => {
            if (this.connection) {
                resolve(this.connection);

                return;
            }

            client.connect((error, newClient) => {
                if (error) {
                    log.error('Could not connect to MongoDB database.');
                    log.error(`Error Info: ${error}`);

                    return reject(error);
                }

                this.connection = newClient!.db(this.database);

                resolve(this.connection);
            });
        });
    }
}
