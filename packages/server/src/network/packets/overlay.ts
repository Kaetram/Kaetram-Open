import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Overlay extends Packet {
    public constructor(opcode: Opcodes.Overlay, data?: unknown) {
        super(Packets.Overlay, opcode, data);
    }
}
