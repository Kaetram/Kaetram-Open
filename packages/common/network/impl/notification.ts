import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export interface NotificationPacketData {
    title?: string; // Title when displaying a popup.
    message: string; // String message to display.
    colour?: string; // Colour of the message.
    source?: string;
    soundEffect?: string;
}

export type NotificationPacketCallback = (
    opcode: Opcodes.Notification,
    info: NotificationPacketData
) => void;

export default class NotificationPacket extends Packet {
    public constructor(opcode: Opcodes.Notification, data: NotificationPacketData) {
        super(Packets.Notification, opcode, data);
    }
}
