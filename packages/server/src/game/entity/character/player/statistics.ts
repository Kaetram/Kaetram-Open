import { Modules } from '@kaetram/common/network';

import type Player from './player';
import type { StatisticsData } from '@kaetram/common/types/statistics';

export default class Statistics {
    private milestones = [10, 50, 100, 500, 1000, 5000, 10_000];

    public pvpKills = 0;
    public pvpDeaths = 0;
    public mobKills: { [key: string]: number } = {};
    public mobExamines: string[] = [];
    public resources: { [key: string]: number } = {};
    public drops: { [key: string]: number } = {};

    public creationTime = this.getTime(); // Time of game's creation.
    public totalTimePlayed = 0; // Total time played in milliseconds.
    public averageTimePlayed = 0;
    public lastLogin = this.getTime();
    public loginCount = 1;

    // Class variables for calculating login time, etc.
    public loginTime = this.getTime(); // Time when player logged in.

    public constructor(private player: Player) {}

    /**
     * Loads the statistics data from the database.
     * @param data Contains the statistics data.
     */

    public load(data: StatisticsData): void {
        this.pvpKills = data.pvpKills || this.pvpKills;
        this.pvpDeaths = data.pvpDeaths || this.pvpDeaths;
        this.mobKills = data.mobKills || this.mobKills;
        this.mobExamines = data.mobExamines || this.mobExamines;
        this.resources = data.resources || this.resources;
        this.drops = data.drops || this.drops;

        this.creationTime = data.creationTime || this.creationTime;
        this.totalTimePlayed = data.totalTimePlayed || this.totalTimePlayed;
        this.averageTimePlayed = data.averageTimePlayed || this.averageTimePlayed;
        this.lastLogin = data.lastLogin || this.lastLogin;
        this.loginCount = data.loginCount + 1 || this.loginCount;
    }

    /**
     * Handles a player harvesting a resource from a skill. When a player successfully
     * cuts a tree, mines a rock, or fishes, this function is called to handle the
     * statistics for that skill. When we reach one of the milestones, we finish the
     * achievement for that milestone.
     * @param skill The skill that the player is harvesting from.
     */

    public handleSkill(skill: Modules.Skills): void {
        // Skip foraging since we don't have any achievements for it.
        if (skill === Modules.Skills.Foraging) return;

        // Get the skill name and the intervals for the milestones.
        let skillName = Modules.Skills[skill].toLowerCase();

        if (!(skillName in this.resources)) this.resources[skillName] = 0;

        // Increment the skill's resource count.
        this.resources[skillName]++;

        // Check if we have reached a milestone and award an achievement if we have.
        if (this.milestones.includes(this.resources[skillName]))
            this.player.achievements.get(`${skillName}${this.resources[skillName]}`)?.finish();
    }

    /**
     * Appends a mob kill onto the statistics. A mob is killed by a player
     * when they deal the primary amount of damage on the damage table.
     * @param key The key of the mob that was killed.
     */

    public addMobKill(key: string): void {
        if (!(key in this.mobKills)) this.mobKills[key] = 0;

        this.mobKills[key]++;
    }

    /**
     * Handles examining a mob and rewarding the appropriate achievement.
     * @param key The key of the mob that was examined.
     */

    public addMobExamine(key: string): void {
        if (this.mobExamines.includes(key)) return;

        this.mobExamines.push(key);

        // Handle achievements for each milestone
        switch (this.mobExamines.length) {
            case 10: {
                return this.player.achievements.get('examiner10').finish();
            }

            case 25: {
                return this.player.achievements.get('examiner25').finish();
            }

            case 50: {
                return this.player.achievements.get('examiner50').finish();
            }
        }
    }

    /**
     * Adds a drop to the player's statistics. This is called when a player
     * receives a drop and we are incrementing the amount of items they have
     * received of that type.
     * @param key The key of the item that was dropped.
     * @param count (Optional) The amount of items that were dropped.
     */

    public addDrop(key: string, count = 1): void {
        if (!(key in this.drops)) this.drops[key] = count;

        this.drops[key] += count;
    }

    /**
     * Calculates the average time played by the player. Think of this as adding
     * every amount of time the player has been logged in together and dividing
     * by the amount of logins. e.g. (login1Time + login2Time + login3Time) / 3
     *
     * NewAverage = (OldAverage * (LoginCount - 1) + NewTime) / LoginCount
     */

    public calculateAverageTimePlayed(): void {
        let timePlayed = Date.now() - this.loginTime;

        this.averageTimePlayed =
            this.averageTimePlayed === 0
                ? timePlayed
                : Math.floor(
                      (this.averageTimePlayed * (this.loginCount - 1) + timePlayed) /
                          this.loginCount
                  );
    }

    /**
     * Serializes all of the player's statistic data into a single object.
     * @returns A StatisticsData object.
     */

    public serialize(): StatisticsData {
        // Serializing also gets treated as a logging out event, so we calculate stuff here.
        this.lastLogin = this.getTime();
        this.totalTimePlayed += Date.now() - this.loginTime; // add time played to total time played.
        this.calculateAverageTimePlayed();

        return {
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            mobKills: this.mobKills,
            mobExamines: this.mobExamines,
            resources: this.resources,
            drops: this.drops,
            creationTime: this.creationTime,
            totalTimePlayed: this.totalTimePlayed,
            averageTimePlayed: this.averageTimePlayed,
            lastLogin: this.lastLogin,
            loginCount: this.loginCount,
            cheater: this.player.isCheater()
        };
    }

    /**
     * Gets the UNIX epoch time in seconds. This is because storing seconds
     * is easier for the database (as it can cause later down the line.)
     * @returns The current UNIX epoch time in seconds.
     */

    private getTime(): number {
        return Math.floor(Date.now() / 1000);
    }
}
