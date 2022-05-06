import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Quest extends Packet {
    public constructor(opcode: Opcodes.Quest, data: unknown) {
        super(Packets.Quest, opcode, data);
    }
}
