import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Welcome extends Packet {
    public constructor(data: unknown) {
        super(Packets.Welcome, undefined, data);
    }
}
