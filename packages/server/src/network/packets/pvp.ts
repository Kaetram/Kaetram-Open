import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import { PVPPacket } from '@kaetram/common/types/messages/outgoing';

export default class PVP extends Packet {
    public constructor(data: PVPPacket) {
        super(Packets.PVP, undefined, data);
    }
}
