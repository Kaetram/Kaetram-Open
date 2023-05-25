import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { TeleportPacket } from '@kaetram/common/types/messages/outgoing';

export default class Teleport extends Packet {
    public constructor(data: TeleportPacket) {
        super(Packets.Teleport, undefined, data);
    }
}
