import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { SlotData } from '@kaetram/common/types/slot';

export interface LootBagPacketData {
    items?: SlotData[];
    index?: number;
}

export type LootBagPacketCallback = (opcode: Opcodes.LootBag, info: LootBagPacketData) => void;

export default class LootBagPacket extends Packet {
    public constructor(opcode: Opcodes.LootBag, info: LootBagPacketData) {
        super(Packets.LootBag, opcode, info);
    }
}
