import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { FriendsPacketData as HubFriendsPacketData } from '@kaetram/common/types/messages/hub';

export interface FriendInfo {
    online: boolean;
    serverId: number;
}

export interface Friend {
    [username: string]: FriendInfo;
}

export interface FriendsPacketData {
    list?: Friend;
    username?: string;
    status?: boolean;
    serverId?: number;
}

export type FriendsPacketCallback = (opcode: Opcodes.Friends, info: FriendsPacketData) => void;

export default class FriendsPacket extends Packet {
    public constructor(opcode?: Opcodes.Friends, data?: FriendsPacketData | HubFriendsPacketData) {
        super(Packets.Friends, opcode, data);
    }
}
