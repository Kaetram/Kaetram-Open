import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { GuildPacket } from '@kaetram/common/types/messages/outgoing';

export default class Guild extends Packet {
    public constructor(opcode?: Opcodes.Guild, data?: GuildPacket) {
        super(Packets.Guild, opcode, data);
    }
}
