import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { LootBagPacket } from '@kaetram/common/types/messages/outgoing';

export default class LootBag extends Packet {
    public constructor(opcode: Opcodes.LootBag, info: LootBagPacket) {
        super(Packets.LootBag, opcode, info);
    }
}
