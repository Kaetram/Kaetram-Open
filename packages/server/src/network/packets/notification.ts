import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { NotificationPacket } from '@kaetram/common/types/messages/outgoing';

export default class Notification extends Packet {
    public constructor(opcode: Opcodes.Notification, data: NotificationPacket) {
        super(Packets.Notification, opcode, data);
    }
}
