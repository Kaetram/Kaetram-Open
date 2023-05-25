import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { ExperiencePacket } from '@kaetram/common/types/messages/outgoing';

export default class Experience extends Packet {
    public constructor(opcode: Opcodes.Experience, data: ExperiencePacket) {
        super(Packets.Experience, opcode, data);
    }
}
