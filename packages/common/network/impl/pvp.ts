import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export interface PVPPacketData {
    state: boolean;
}

export type PVPPacketCallback = (info: PVPPacketData) => void;

export default class PVPPacket extends Packet {
    public constructor(data: PVPPacketData) {
        super(Packets.PVP, undefined, data);
    }
}
