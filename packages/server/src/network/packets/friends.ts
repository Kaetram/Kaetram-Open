import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { FriendsPacket } from '@kaetram/common/types/messages/outgoing';

export default class Friends extends Packet {
    public constructor(opcode: Opcodes.Friends, data: FriendsPacket) {
        super(Packets.Friends, opcode, data);
    }
}
