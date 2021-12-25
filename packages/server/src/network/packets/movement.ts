import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Movement extends Packet {
    public constructor(opcode: Opcodes.Movement, data?: unknown) {
        super(Packets.Movement, opcode, data);
    }
}
