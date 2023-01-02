import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

export default class Handshake extends Packet {
    public constructor() {
        super(Packets.Handshake);
    }
}
