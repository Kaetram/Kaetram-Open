import { Opcodes, Packets } from '@kaetram/common/network';

import Packet from '../packet';

export default class Bubble extends Packet {
    public constructor(data: unknown, opcode = Opcodes.Bubble.Entity) {
        super(Packets.Bubble, opcode, data);
    }
}
