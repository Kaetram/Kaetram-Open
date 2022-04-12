import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Store extends Packet {
    public constructor(opcode: Opcodes.Store, data: unknown) {
        super(Packets.Store, opcode, data);
    }
}
