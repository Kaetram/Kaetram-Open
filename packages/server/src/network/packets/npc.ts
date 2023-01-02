import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';

export default class NPC extends Packet {
    public constructor(opcode: Opcodes.NPC, data: unknown) {
        super(Packets.NPC, opcode, data);
    }
}
