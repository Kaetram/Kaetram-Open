import type { Modules, Opcodes } from '../network';

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

// Used to relay update information to other players.
export interface UpdateInfo {
    opcode: Opcodes.Guild;
    username: string;
    serverId?: number;
    rank?: Modules.GuildRank;
}
