import type { StatisticsData } from '@kaetram/common/types/statistics';

export default class Statistics {
    public pvpKills = 0;
    public pvpDeaths = 0;

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
        this.creationTime = data.creationTime || this.creationTime;
        this.totalTimePlayed = data.totalTimePlayed || this.totalTimePlayed;
        this.averageTimePlayed = data.averageTimePlayed || this.averageTimePlayed;
        this.lastLogin = data.lastLogin || this.lastLogin;
        this.loginCount = data.loginCount + 1 || this.loginCount;
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
            creationTime: this.creationTime,
            totalTimePlayed: this.totalTimePlayed,
            averageTimePlayed: this.averageTimePlayed,
            lastLogin: this.lastLogin,
            loginCount: this.loginCount
        };
    }
}
