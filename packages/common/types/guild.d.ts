import type { Modules, Opcodes } from '../network';

export interface Member {
    username: string;
    rank?: Modules.GuildRank;
    joinDate?: number;
    serverId?: number; // -1 if offline
}

export interface Decoration {
    banner: Modules.BannerColours;
    outline: Modules.BannerOutline;
    crest: Modules.BannerCrest;
}

export interface GuildData {
    identifier: string;
    name: string;
    creationDate: number;
    owner: string;
    inviteOnly: boolean;
    experience: number;
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
