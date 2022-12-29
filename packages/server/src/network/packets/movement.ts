import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { MovementPacket } from '@kaetram/common/types/messages/outgoing';

export default class Movement extends Packet {
    public constructor(opcode: Opcodes.Movement, data?: MovementPacket) {
        super(Packets.Movement, opcode, data);
    }
}
