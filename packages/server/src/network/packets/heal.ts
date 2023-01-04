import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { HealPacket } from '@kaetram/common/types/messages/outgoing';

export default class Heal extends Packet {
    public constructor(data: HealPacket) {
        super(Packets.Heal, undefined, data);
    }
}
