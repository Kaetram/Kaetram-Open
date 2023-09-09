import { exit } from 'node:process';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import mobs from '@kaetram/server/data/mobs.json';
import Database from '@kaetram/common/database/database';

import type MongoDB from '@kaetram/common/database/mongodb/mongodb';
import type { RawMobData } from '@kaetram/common/types/mob';
import type { Modules } from '@kaetram/common/network';
import type {
    MobAggregate,
    PvpAggregate,
    SkillExperience,
    TotalExperience
} from '@kaetram/common/types/leaderboards';

export default class Cache {
    /**
     * The cache keeps track of database information that we extract. We use it
     * so that we do not make database requests repeatedly, and instead use
     * existing ones. The cache is updated after a specified amount of time.
     */
    public database: MongoDB = new Database(config.database).getDatabase()!;

    private pvpAggregate: PvpAggregate[] = [];
    private totalExperience: TotalExperience[] = [];
    private skillsExperience: { [key: number]: SkillExperience[] } = {};
    private mobAggregates: { [key: string]: MobAggregate[] } = {};

    // List of all mobs that can be checked in the leaderboards
    public availableMobs: { [key: string]: string } = {};

    // Last time we aggregated the total experience.
    private lastAggregates: { [key: string]: number } = {};

    public constructor() {
        // If we are skipping the database, then we do not need to initialize anything.
        if (config.skipDatabase) return;

        this.database.onFail(this.handleFail.bind(this));

        // Initialize the available mobs.
        for (let key in mobs) this.availableMobs[key] = (mobs as RawMobData)[key].name;
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
     * Gathers the aggregate data for pvp kills. The data is ordered in descending order.
     * @param callback Contains an array of top pvp stats.
     */

    public getPvpData(callback?: (pvpAggregate: PvpAggregate[]) => void): void {
        if (!this.canAggregateData(this.lastAggregates.pvp)) return callback?.(this.pvpAggregate);

        this.database.getPvpAggregate((data: PvpAggregate[]) => {
            callback?.((this.pvpAggregate = data));

            // Update the last aggregate time.
            this.lastAggregates.pvp = Date.now();
        });
    }

    /**
     * Uses the aggregate data to update the cache or return the
     * cached data if we have not reached the threshold.
     */

    public getTotalExperience(callback?: (totalExperience: TotalExperience[]) => void): void {
        if (!this.canAggregateData(this.lastAggregates.total))
            return callback?.(this.totalExperience);

        this.database.getTotalExperienceAggregate((data: TotalExperience[]) => {
            for (let info of data) if (!info.cheater) delete info.cheater;

            callback?.((this.totalExperience = data));

            // Update the last aggregate time.
            this.lastAggregates.total = Date.now();
        });
    }

    /**
     * Aggregates data for a specific skill. Data for each skill is then stored in its
     * respective dictionary.
     * @param skill The skill id we are aggregating.
     * @param callback Contains the leaderboards information for the skills (in descending order).
     */

    public getSkillsExperience(
        skill: Modules.Skills,
        callback: (skillInfo: SkillExperience[]) => void
    ): void {
        if (!this.canAggregateData(this.lastAggregates[skill]))
            return callback(this.skillsExperience[skill]);

        this.database.getSkillAggregate(skill, (data: SkillExperience[]) => {
            for (let info of data) if (!info.cheater) delete info.cheater;

            callback((this.skillsExperience[skill] = data));

            // Update the last aggregate time.
            this.lastAggregates[skill] = Date.now();
        });
    }

    /**
     * Aggregates mob kill data for a specified mob key.
     * @param key The key of the mob we are aggregating.
     * @param callback Contains a list of mob kill information (in descending order).
     */

    public getMobKills(key: string, callback: (mobInfo: MobAggregate[]) => void): void {
        if (!this.canAggregateData(this.lastAggregates[key]))
            return callback(this.mobAggregates[key]);

        this.database.getMobAggregate(key, (data: MobAggregate[]) => {
            callback((this.mobAggregates[key] = data));

            // Update the last aggregate time.
            this.lastAggregates[key] = Date.now();
        });
    }

    /**
     * Uses the last aggregate dictionary to determine whether the aggegate we are
     * checking from the parameters has been updated recently. If it has, we check
     * if we are using cached data or updating.
     * @param aggregate The aggregate we are checking.
     * @returns Whether or not we can aggregate new data.
     */

    private canAggregateData(aggregate: number): boolean {
        // Doesn't matter since there is no aggregate data.
        if (config.skipDatabase) return true;

        let lastAggregate = isNaN(aggregate) ? 0 : aggregate;

        return Date.now() - lastAggregate > config.aggregateThreshold;
    }
}
