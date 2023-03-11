import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { HandshakePacket } from '@kaetram/common/types/messages/outgoing';
import type { HandshakePacket as HubHandshakePacket } from '@kaetram/common/types/messages/hub';

export default class Handshake extends Packet {
    public constructor(data: HandshakePacket | HubHandshakePacket) {
        super(Packets.Handshake, undefined, data);
    }
}
