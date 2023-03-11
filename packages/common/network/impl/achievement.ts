import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { AchievementPacket } from '@kaetram/common/types/messages/outgoing';

export default class Achievement extends Packet {
    public constructor(opcode: Opcodes.Achievement, data: AchievementPacket) {
        super(Packets.Achievement, opcode, data);
    }
}
