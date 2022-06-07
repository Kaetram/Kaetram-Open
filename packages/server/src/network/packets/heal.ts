import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import { HealPacket } from '@kaetram/common/types/messages/outgoing';

export default class Heal extends Packet {
    public constructor(data: HealPacket) {
        super(Packets.Heal, undefined, data);
    }
}
