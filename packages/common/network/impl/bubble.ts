import Packet from '../packet';

import { Opcodes, Packets } from '@kaetram/common/network';

export default class Bubble extends Packet {
    public constructor(data: unknown, opcode = Opcodes.Bubble.Entity) {
        super(Packets.Bubble, opcode, data);
    }
}
