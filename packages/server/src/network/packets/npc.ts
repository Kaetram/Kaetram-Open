import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class NPC extends Packet {
    public constructor(opcode: Opcodes.NPC, data: unknown) {
        super(Packets.NPC, opcode, data);
    }
}
