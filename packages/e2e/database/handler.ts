/**
 * The handler class file for the Mob object. We use this to better
 * organize callbacks and events instead of clumping them all.
 */
import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import MongoDB from '@kaetram/e2e/database/mongodb';

import type { AnyError } from 'mongodb';

export default class Handler {
    private mongo: MongoDB;

    public constructor() {
        let { NODE_ENV } = process.env;
        if (NODE_ENV !== 'e2e' || !config.mongodbDatabase.includes('e2e')) {
            log.error(
                `Something is wrong with your configuration, your NODE_ENV is not set to 'e2e' or your database name does not include 'e2e'.
        This might cause you to mess up [${config.mongodbDatabase}] via the e2e tests. Stopping the server.`
            );

            throw new Error(
                `Wrong input to run mongo test REST server. [NODE_ENV=${NODE_ENV},mongodbDatabase=${config.mongodbDatabase}]`
            );
        }

        this.mongo = new MongoDB(
            config.mongodbHost,
            config.mongodbPort,
            config.mongodbUser,
            config.mongodbPassword,
            config.mongodbDatabase,
            config.mongodbTls,
            config.mongodbSrv
        );
    }

    public getByUsername(
        collectionName: string,
        username: string,
        callback: (data: unknown[]) => void
    ) {
        this.mongo.load({ username }, collectionName, callback);
    }

    public upsert(
        collectionName: string,
        username: string,
        body: unknown,
        callback: (error?: AnyError) => void
    ) {
        this.mongo.upsert({ username }, collectionName, body, callback);
    }

    public delete(collectionName: string, username: string, callback: (error?: AnyError) => void) {
        this.mongo.delete({ username }, collectionName, callback);
    }

    public deleteCollection(collectionName: string, callback: (error?: AnyError) => void) {
        this.mongo.deleteCollection(collectionName, callback);
    }
}
