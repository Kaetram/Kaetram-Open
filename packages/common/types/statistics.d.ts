export interface StatisticsData {
    pvpKills: number;
    pvpDeaths: number;
    mobKills: { [key: string]: number };

    creationTime: number;
    totalTimePlayed: number;
    averageTimePlayed: number;
    lastLogin: number;
    loginCount: number;
}
