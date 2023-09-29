import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { ChatPacketData as HubChatPacketData } from '@kaetram/common/types/messages/hub';

export interface ChatPacketData {
    instance?: string; // Entity that the chat packet belongs to.
    message: string; // Message contents of the packet.
    withBubble?: boolean; // If the message should have a bubble.
    colour?: string; // Colour of the message.
    source?: string;
}

export type ChatPacketCallback = (info: ChatPacketData) => void;

export default class ChatPacket extends Packet {
    public constructor(data: ChatPacketData | HubChatPacketData) {
        super(Packets.Chat, undefined, data);
    }
}
