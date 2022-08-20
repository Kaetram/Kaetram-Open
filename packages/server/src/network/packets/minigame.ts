import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { MinigamePacket } from '@kaetram/common/types/messages/outgoing';

export default class Minigame extends Packet {
    public constructor(opcode: Opcodes.Minigame, data?: MinigamePacket) {
        super(Packets.Minigame, opcode, data);
    }
}
