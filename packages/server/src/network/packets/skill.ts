import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { SkillPacket } from '@kaetram/common/types/messages/outgoing';

export default class Skill extends Packet {
    public constructor(opcode: Opcodes.Skill, data?: SkillPacket) {
        super(Packets.Skill, opcode, data);
    }
}
