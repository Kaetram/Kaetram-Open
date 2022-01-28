import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Container extends Packet {
    public constructor(opcode: Opcodes.Container, data: unknown) {
        super(Packets.Container, opcode, data);
    }
}
