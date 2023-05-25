import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { QuestPacket } from '@kaetram/common/types/messages/outgoing';

export default class Quest extends Packet {
    public constructor(opcode: Opcodes.Quest, data: QuestPacket) {
        super(Packets.Quest, opcode, data);
    }
}
