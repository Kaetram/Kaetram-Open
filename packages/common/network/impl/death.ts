import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export default class Death extends Packet {
    public constructor(instance: string) {
        super(Packets.Death, undefined, instance);
    }
}
