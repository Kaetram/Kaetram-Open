import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Shop extends Packet {
    public constructor(opcode: Opcodes.Shop, data: unknown) {
        super(Packets.Shop, opcode, data);
    }
}
