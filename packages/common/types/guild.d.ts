import type { Modules } from '../network';

export interface Member {
    username: string;
    rank: Modules.GuildRank;
    joinDate: number;
    serverId: number; // -1 if offline
}

export interface GuildData {
    identifier: string;
    name: string;
    owner: string;
    inviteOnly: boolean;
    members: Member[];
}
