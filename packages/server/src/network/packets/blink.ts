import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

export default class Blink extends Packet {
    public constructor(instance: string) {
        super(Packets.Blink, undefined, instance);
    }
}
