import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Experience extends Packet {
    public constructor(opcode: Opcodes.Experience, data: unknown) {
        super(Packets.Experience, opcode, data);
    }
}
