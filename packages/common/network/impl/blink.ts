import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export type BlinkPacketCallback = (instance: string) => void;

export default class BlinkPacket extends Packet {
    public constructor(instance: string) {
        super(Packets.Blink, undefined, instance);
    }
}
