import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { AchievementPacket } from '@kaetram/common/types/messages/outgoing';

export default class Achievement extends Packet {
    public constructor(opcode: Opcodes.Achievement, data: AchievementPacket) {
        super(Packets.Achievement, opcode, data);
    }
}
