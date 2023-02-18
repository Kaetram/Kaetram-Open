import { exit } from 'node:process';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Database from '@kaetram/common/database/database';

import type MongoDB from '@kaetram/common/database/mongodb/mongodb';
import type { TotalExperience } from '@kaetram/common/types/leaderboards';

export default class Cache {
    /**
     * The cache keeps track of database information that we extract. We use it
     * so that we do not make database requests repeatedly, and instead use
     * existing ones. The cache is updated after a specified amount of time.
     */
    private database: MongoDB = new Database(config.database).getDatabase()!;

    private totalExperience: TotalExperience[] = [];

    // Last time we aggregated the total experience.
    private lastAggregate = 0;

    public constructor() {
        // If we are skipping the database, then we do not need to initialize anything.
        if (config.skipDatabase) return;

        this.database.onFail(this.handleFail.bind(this));
    }

    /**
     * If we fail to connect to the database we must abort.
     */

    private handleFail(error: Error): void {
        log.critical('Could not connect to the MongoDB server.');
        log.critical(`Error: ${error}`);

        // Exit the process.
        exit(1);
    }

    /**
     * Uses the aggregate data to update the cache or return the
     * cached data if we have not reached the threshold.
     */

    public getTotalExperience(callback: (totalExperience: TotalExperience[]) => void): void {
        if (!this.canAggregateData()) return callback(this.totalExperience);

        this.database.getTotalExperienceAggregate((data: TotalExperience[]) => {
            callback((this.totalExperience = data));

            // Update the last aggregate time.
            this.lastAggregate = Date.now();
        });
    }

    /**
     * Cached data is updated at a specified aggregate threshold. Until we reach that,
     * then we will use the cached data.
     * @returns Whether or not we can aggregate new data.
     */

    private canAggregateData(): boolean {
        return Date.now() - this.lastAggregate > config.aggregateThreshold && !config.skipDatabase;
    }
}
