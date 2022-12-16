import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

export default class Death extends Packet {
    public constructor(instance: string) {
        super(Packets.Death, undefined, instance);
    }
}
