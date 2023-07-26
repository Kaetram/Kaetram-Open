import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules, Opcodes } from '@kaetram/common/network';

export interface Member {
    username: string;
    rank?: Modules.GuildRank;
    joinDate?: number;
    serverId?: number; // -1 if offline
}

export interface Decoration {
    banner: Modules.BannerColour;
    outline: Modules.BannerOutline;
    outlineColour: Modules.BannerColour;
    crest: Modules.BannerCrests;
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

export interface GuildPacketData {
    identifier?: string;
    name?: string;
    username?: string;
    usernames?: string[];
    serverId?: number;
    member?: Member;
    members?: Member[];
    total?: number;
    guilds?: ListInfo[];
    message?: string;
    owner?: string;
    decoration?: Decoration;
    experience?: number;
    rank?: Modules.GuildRank;
}

export type GuildPacketCallback = (opcode: Opcodes.Guild, info: GuildPacketData) => void;

export default class GuildPacket extends Packet {
    public constructor(opcode?: Opcodes.Guild, data?: GuildPacketData) {
        super(Packets.Guild, opcode, data);
    }
}
