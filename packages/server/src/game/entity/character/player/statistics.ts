import type { StatisticsData } from '@kaetram/common/types/statistics';

export default class Statistics {
    public pvpKills = 0;
    public pvpDeaths = 0;
    public mobKills: { [key: string]: number } = {};

    public creationTime = Date.now(); // Time of game's creation.
    public totalTimePlayed = 0; // Total time played in milliseconds.
    public averageTimePlayed = 0;
    public lastLogin = Date.now();
    public loginCount = 1;

    // Class variables for calculating login time, etc.
    public loginTime = Date.now(); // Time when player logged in.

    /**
     * Loads the statistics data from the database.
     * @param data Contains the statistics data.
     */

    public load(data: StatisticsData): void {
        this.pvpKills = data.pvpKills || this.pvpKills;
        this.pvpDeaths = data.pvpDeaths || this.pvpDeaths;
        this.mobKills = data.mobKills || this.mobKills;

        this.creationTime = data.creationTime || this.creationTime;
        this.totalTimePlayed = data.totalTimePlayed || this.totalTimePlayed;
        this.averageTimePlayed = data.averageTimePlayed || this.averageTimePlayed;
        this.lastLogin = data.lastLogin || this.lastLogin;
        this.loginCount = data.loginCount + 1 || this.loginCount;
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
        this.lastLogin = Date.now();
        this.totalTimePlayed += Date.now() - this.loginTime; // add time played to total time played.
        this.calculateAverageTimePlayed();

        return {
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            mobKills: this.mobKills,
            creationTime: this.creationTime,
            totalTimePlayed: this.totalTimePlayed,
            averageTimePlayed: this.averageTimePlayed,
            lastLogin: this.lastLogin,
            loginCount: this.loginCount
        };
    }
}
