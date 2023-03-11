import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { ChatPacket } from '@kaetram/common/types/messages/outgoing';
import type { ChatPacket as HubChatPacket } from '@kaetram/common/types/messages/hub';

export default class Chat extends Packet {
    public constructor(data: ChatPacket | HubChatPacket) {
        super(Packets.Chat, undefined, data);
    }
}
