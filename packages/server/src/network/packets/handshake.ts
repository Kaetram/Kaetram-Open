import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { HandshakePacket } from '@kaetram/common/types/messages/outgoing';

export default class Handshake extends Packet {
    public constructor(data: HandshakePacket) {
        super(Packets.Handshake, undefined, data);
    }
}
