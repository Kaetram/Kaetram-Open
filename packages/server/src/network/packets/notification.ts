import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { NotificationPacket } from '@kaetram/common/types/messages/outgoing';

export default class Notification extends Packet {
    public constructor(opcode: Opcodes.Notification, data: NotificationPacket) {
        super(Packets.Notification, opcode, data);
    }
}
