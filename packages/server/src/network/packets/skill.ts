import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { SkillPacket } from '@kaetram/common/types/messages/outgoing';

export default class Skill extends Packet {
    public constructor(opcode: Opcodes.Skill, data?: SkillPacket) {
        super(Packets.Skill, opcode, data);
    }
}
