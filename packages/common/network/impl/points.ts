import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export interface PointsPacketData {
    instance: string;
    hitPoints?: number;
    maxHitPoints?: number;
    mana?: number;
    maxMana?: number;
}

export type PointsPacketCallback = (info: PointsPacketData) => void;

export default class PointsPacket extends Packet {
    public constructor(data: PointsPacketData) {
        super(Packets.Points, undefined, data);
    }
}
