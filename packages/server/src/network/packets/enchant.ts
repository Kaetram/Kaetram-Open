import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';

export default class Enchant extends Packet {
    public constructor(opcode: Opcodes.Enchant, data: unknown) {
        super(Packets.Enchant, opcode, data);
    }
}
