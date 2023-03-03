import type { Modules } from '../network';

export interface Member {
    username: string;
    rank: Modules.GuildRank;
    joinDate: number;
}

export interface GuildData {
    name: string;
    owner: string;
    members: Member[];
}
