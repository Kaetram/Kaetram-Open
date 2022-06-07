import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { MovementPacket } from '@kaetram/common/types/messages/outgoing';

export default class Movement extends Packet {
    public constructor(opcode: Opcodes.Movement, data?: MovementPacket) {
        super(Packets.Movement, opcode, data);
    }
}
