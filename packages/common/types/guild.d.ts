import type { Modules, Opcodes } from '../network';

export interface Member {
    username: string;
    rank: Modules.GuildRank;
    joinDate: number;
    serverId: number; // -1 if offline
}

export interface Decoration {
    banner: string;
    outline: string;
    crest: string;
}

export interface GuildData {
    identifier: string;
    name: string;
    owner: string;
    inviteOnly: boolean;
    decoration: Decoration;
    members: Member[];
}

// Used to relay update information to other players.
export interface UpdateInfo {
    opcode: Opcodes.Guild;
    username: string;
    serverId?: number;
    rank?: Modules.GuildRank;
}

// Contains only necessary information to be passed to client.
export interface ListInfo {
    name: string;
    members: number;
    decoration: Decoration;
}
