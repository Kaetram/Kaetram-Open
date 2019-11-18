/* global module */

const MongoDB = require('./mongodb/mongodb'),
    config = require('../../config');

class Database {
    constructor(databaseType) {
        const self = this;

        self.database = null;
        self.databaseType = databaseType;

        switch (self.databaseType) {
            case 'mongo':
            case 'mongodb':
                self.database = new MongoDB(config.mongoHost, config.mongoPort, config.mongoUser,
                    config.mongoPassword, config.mongoDatabase);
                break;

            default:
                log.error('The database ' + self.databaseType + ' could not be found.');
                break;
        }
    }

    getDatabase() {
        const self = this;

        if (!self.database)
            log.error('[Database] No database is currently present. It is advised against proceeding in this state.');

        return self.database;
    }
}

module.exports = Database;
