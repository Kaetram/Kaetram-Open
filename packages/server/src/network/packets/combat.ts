import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { CombatPacket } from '@kaetram/common/types/messages/outgoing';

export default class Combat extends Packet {
    public constructor(opcode: Opcodes.Combat, data: CombatPacket) {
        super(Packets.Combat, opcode, data);
    }
}
