import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { ExperiencePacket } from '@kaetram/common/types/messages/outgoing';

export default class Experience extends Packet {
    public constructor(opcode: Opcodes.Experience, data: ExperiencePacket) {
        super(Packets.Experience, opcode, data);
    }
}
