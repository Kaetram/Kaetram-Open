import MongoDB from './mongodb/mongodb';
import config from '../../config';

/**
 * Loads and initializes the database.
 */
class Database {
    public database: MongoDB;

    /**
     * Creates an instance of Database.
     * @param databaseType - The name of the library to use for the database.
     */
    constructor(public databaseType: string) {
        this.database = null;

        switch (this.databaseType) {
            case 'mongo':
            case 'mongodb':
                this.database = new MongoDB(
                    config.mongoHost,
                    config.mongoPort,
                    config.mongoUser,
                    config.mongoPassword,
                    config.mongoDatabase
                );
                break;

            default:
                console.error(
                    `The database ${this.databaseType} could not be found.`
                );
                break;
        }
    }

    getDatabase() {
        if (!this.database)
            console.error(
                '[Database] No database is currently present. It is advised against proceeding in this state.'
            );

        return this.database;
    }
}

export default Database;
