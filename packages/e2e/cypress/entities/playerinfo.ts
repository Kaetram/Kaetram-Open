export interface PlayerInfo {
    username: string;
    password: string;
    email: string;
    x: number;
    y: number;
    userAgent: string | null;
    experience: number;
    rank: number;
    poison: string;
    hitPoints: number;
    mana: number;
    pvpKills: number;
    pvpDeaths: number;
    orientation: number;
    ban: number;
    mute: number;
    lastLogin: number;
    lastWarp: number;
    mapVersion: number;
}
