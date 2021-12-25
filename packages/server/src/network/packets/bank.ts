import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Bank extends Packet {
    public constructor(opcode: Opcodes.Bank, data: unknown) {
        super(Packets.Bank, opcode, data);
    }
}
