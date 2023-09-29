import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export type DeathPacketCallback = () => void;

export default class DeathPacket extends Packet {
    public constructor(instance: string) {
        super(Packets.Death, undefined, instance);
    }
}
