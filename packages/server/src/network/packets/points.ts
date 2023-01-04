import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { PointsPacket } from '@kaetram/common/types/messages/outgoing';

export default class Points extends Packet {
    public constructor(data: PointsPacket) {
        super(Packets.Points, undefined, data);
    }
}
