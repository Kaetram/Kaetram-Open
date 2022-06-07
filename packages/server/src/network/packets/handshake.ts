import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Handshake extends Packet {
    public constructor() {
        super(Packets.Handshake);
    }
}
