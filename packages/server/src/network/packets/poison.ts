import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

export default class Poison extends Packet {
    public constructor(type: number) {
        super(Packets.Poison, undefined, type);
    }
}
