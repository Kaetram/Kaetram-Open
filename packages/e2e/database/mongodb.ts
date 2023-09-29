import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import { MongoClient } from 'mongodb';

import type { AnyError, Db } from 'mongodb';

export default class MongoDB {
    private connectionUrl: string;

    private database!: Db;

    private _isReady = false;
    public get isReady() {
        return this._isReady;
    }

    public constructor(
        host: string,
        port: number,
        username: string,
        password: string,
        private databaseName: string,
        private tls: boolean,
        srv: boolean,
        authSource: string
    ) {
        let srvInsert = srv ? 'mongodb+srv' : 'mongodb',
            authInsert = username && password ? `${username}:${password}@` : '',
            portInsert = port > 0 ? `:${port}` : '',
            authSourceInsert = authSource ? `?authSource=${authSource}` : '';
        this.connectionUrl = `${srvInsert}://${authInsert}${host}${portInsert}/${databaseName}${authSourceInsert}`;

        console.log(`MongoDB connection URL: ${this.connectionUrl}`);

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

        client
            .connect()
            .then((mongoClient: MongoClient) => {
                this.database = mongoClient.db(this.databaseName);

                this._isReady = true;

                log.notice('Successfully connected to the MongoDB server.');
            })
            .catch((error: Error) => {
                throw new Error(`Error while connecting to mongodb: [${error}]`);
            });
    }

    /**
     * Generalized function for loading data from the database. It will return a
     * data type that is later parsed by the caller. We use this since most serialized
     * information is stored in a similar fashion, thus cleaning up the code.
     * Empty arrays are passed when we cannot find data (or the server is in offline mdoe).
     * @param filter The filter we are using for the find query
     * @param collection The name of the collection.
     * @param callback Raw data from the database or nothing if a problem occurs.
     */

    public load(
        filter: { [key: string]: string },
        collection: string,
        callback: (data: unknown[]) => void
    ): void {
        // Used for when we're working without a database to return empty data.
        if (!this.database || config.skipDatabase) return callback([]);

        let cursor = this.database.collection(collection).find({ ...filter });

        cursor.toArray().then((info) => {
            // Return empty array if we can't find any data.
            if (info.length === 0) return callback([]);

            // Return the raw data from the database.
            callback(info as unknown[]);
        });
    }

    public upsert(
        filter: { [key: string]: string },
        collectionName: string,
        body: unknown,
        callback: (error?: AnyError) => void
    ) {
        let collection = this.database.collection(collectionName);

        collection
            .updateOne(filter, { $set: body }, { upsert: true })
            .then((result) => {
                if (!result)
                    log.error(
                        `Unable to save ${collection.collectionName} for ${JSON.stringify(filter)}.`
                    );
                callback();
            })
            .catch((error) => {
                if (error)
                    log.error(
                        `An error occurred while saving ${
                            collection.collectionName
                        } for ${JSON.stringify(filter)}:`,
                        error
                    );
                callback(error);
            });
    }

    public delete(
        filter: { [key: string]: string },
        collectionName: string,
        callback: (error?: AnyError) => void
    ) {
        let collection = this.database.collection(collectionName);

        collection.deleteOne(filter).then((result) => {
            if (!result)
                log.error(
                    `Unable to delete ${collection.collectionName} for ${JSON.stringify(filter)}.`
                );
            callback();
        });
    }

    public deleteCollection(collectionName: string, callback: (error?: AnyError) => void) {
        let collection = this.database.collection(collectionName);
        collection
            .drop()
            .then((success) => {
                callback(
                    success ? undefined : new Error(`Could not drop collection [${collectionName}]`)
                );
            })
            .catch(function () {
                callback(new Error(`Could not drop collection [${collectionName}]`));
            });
    }
}
