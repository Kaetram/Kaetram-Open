import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export default class Blink extends Packet {
    public constructor(instance: string) {
        super(Packets.Blink, undefined, instance);
    }
}
