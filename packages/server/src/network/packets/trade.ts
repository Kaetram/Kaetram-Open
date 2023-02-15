import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { TradePacket } from '@kaetram/common/types/messages/outgoing';

export default class Trade extends Packet {
    public constructor(opcode: Opcodes.Trade, data: TradePacket) {
        super(Packets.Trade, opcode, data);
    }
}
