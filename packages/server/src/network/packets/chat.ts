import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { ChatPacket } from '@kaetram/common/types/messages/outgoing';

export default class Chat extends Packet {
    public constructor(data: ChatPacket) {
        super(Packets.Chat, undefined, data);
    }
}
