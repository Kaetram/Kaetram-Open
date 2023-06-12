export interface StatisticsData {
    pvpKills: number;
    pvpDeaths: number;
    mobKills: { [key: string]: number };
    mobExamines: string[];
    resources: { [key: string]: number };
    drops: { [key: string]: number };

    creationTime: number;
    totalTimePlayed: number;
    averageTimePlayed: number;
    lastLogin: number;
    loginCount: number;

    cheater: boolean;
}
