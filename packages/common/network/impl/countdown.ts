import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { CountdownPacket } from '@kaetram/common/types/messages/outgoing';

export default class Countdown extends Packet {
    public constructor(data: CountdownPacket) {
        super(Packets.Countdown, undefined, data);
    }
}
