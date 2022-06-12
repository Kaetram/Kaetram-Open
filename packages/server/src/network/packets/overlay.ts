import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { OverlayPacket } from '@kaetram/common/types/messages/outgoing';

export default class Overlay extends Packet {
    public constructor(opcode: Opcodes.Overlay, data?: OverlayPacket) {
        super(Packets.Overlay, opcode, data);
    }
}
