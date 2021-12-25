import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Inventory extends Packet {
    public constructor(opcode: Opcodes.Inventory, data: unknown) {
        super(Packets.Inventory, opcode, data);
    }
}
