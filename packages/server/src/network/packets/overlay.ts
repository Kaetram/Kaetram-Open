import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { OverlayPacket } from '@kaetram/common/types/messages/outgoing';

export default class Overlay extends Packet {
    public constructor(opcode: Opcodes.Overlay, data?: OverlayPacket) {
        super(Packets.Overlay, opcode, data);
    }
}
