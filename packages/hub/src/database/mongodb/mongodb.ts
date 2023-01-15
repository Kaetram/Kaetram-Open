import { MongoClient } from 'mongodb';
import log from '@kaetram/common/util/log';

import Creator from './creator';
import Loader from './loader';

import type { Db } from 'mongodb';

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
}
