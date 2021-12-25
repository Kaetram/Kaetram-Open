import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Combat extends Packet {
    public constructor(opcode: Opcodes.Combat, data: unknown) {
        super(Packets.Combat, opcode, data);
    }
}
