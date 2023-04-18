import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { CraftingPacket } from '@kaetram/common/types/messages/outgoing';

export default class Crafting extends Packet {
    public constructor(opcode: Opcodes.Crafting, data: CraftingPacket) {
        super(Packets.Crafting, opcode, data);
    }
}
