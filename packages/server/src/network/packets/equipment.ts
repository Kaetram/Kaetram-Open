import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Equipment extends Packet {
    public constructor(opcode: Opcodes.Equipment, data: unknown) {
        super(Packets.Equipment, opcode, data);
    }
}
