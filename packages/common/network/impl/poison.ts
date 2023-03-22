import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export default class Poison extends Packet {
    public constructor(type: number) {
        super(Packets.Poison, undefined, type);
    }
}
