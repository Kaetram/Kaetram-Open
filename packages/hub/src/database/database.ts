import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import MongoDB from './mongodb/mongodb';

export type DatabaseType = MongoDB;

export default class Database {
    private database!: DatabaseType;

    public constructor() {
        switch (config.database) {
            case 'mongo':
            case 'mongodb':
                this.database = new MongoDB(
                    config.mongodbHost,
                    config.mongodbPort,
                    config.mongodbUser,
                    config.mongodbPassword,
                    config.mongodbDatabase
                );
                break;

            default:
                log.error(`The database ${config.database} could not be found.`);
                break;
        }
    }

    public getDatabase(): DatabaseType {
        if (!this.database)
            log.error(
                '[Database] No database is currently present. It is advised against proceeding in this state.'
            );

        return this.database;
    }
}
