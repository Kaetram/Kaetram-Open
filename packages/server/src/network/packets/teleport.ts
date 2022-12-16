import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { TeleportPacket } from '@kaetram/common/types/messages/outgoing';

export default class Teleport extends Packet {
    public constructor(data: TeleportPacket) {
        super(Packets.Teleport, undefined, data);
    }
}
