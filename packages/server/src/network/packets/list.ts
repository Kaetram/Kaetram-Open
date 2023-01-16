import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { ListPacket } from '@kaetram/common/types/messages/outgoing';

export default class List extends Packet {
    public constructor(opcode: Opcodes.List, info: ListPacket) {
        super(Packets.List, opcode, info);
    }
}
