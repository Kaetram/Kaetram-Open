import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { StorePacket } from '@kaetram/common/types/messages/outgoing';

export default class Store extends Packet {
    public constructor(opcode: Opcodes.Store, data: StorePacket) {
        super(Packets.Store, opcode, data);
    }
}
