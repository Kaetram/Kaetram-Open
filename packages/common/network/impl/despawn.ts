import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { DespawnPacket } from '@kaetram/common/types/messages/outgoing';

export default class Despawn extends Packet {
    public constructor(info: DespawnPacket) {
        super(Packets.Despawn, undefined, info);
    }
}
