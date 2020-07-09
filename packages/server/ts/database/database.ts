import MongoDB from './mongodb/mongodb';
import config from '../../config';
import log from '../util/log';

class Database {
    database: any;
    databaseType: string;

    constructor(databaseType) {
        this.database = null;
        this.databaseType = databaseType;

        switch (this.databaseType) {
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
                log.error('The database ' + this.databaseType + ' could not be found.');
                break;
        }
    }

    getDatabase(): any {
        if (!this.database)
            log.error(
                '[Database] No database is currently present. It is advised against proceeding in this state.'
            );

        return this.database;
    }
}

export default Database;
