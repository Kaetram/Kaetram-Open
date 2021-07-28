import config from '../../config';
import log from '../util/log';
import MongoDB from './mongodb/mongodb';

export type DatabaseType = 'mongo' | 'mongodb';

export default class Database {
    database: MongoDB | null = null;

    constructor(databaseType: DatabaseType) {
        switch (databaseType) {
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
                log.error('The database ' + databaseType + ' could not be found.');
                break;
        }
    }

    getDatabase(): MongoDB | null {
        if (!this.database)
            log.error(
                '[Database] No database is currently present. It is advised against proceeding in this state.'
            );

        return this.database;
    }
}
