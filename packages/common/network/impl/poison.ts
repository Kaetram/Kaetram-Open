import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export type PoisonPacketCallback = (type: number) => void;

export default class PoisonPacket extends Packet {
    public constructor(type: number) {
        super(Packets.Poison, undefined, type);
    }
}
