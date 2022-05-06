import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Bubble extends Packet {
    public constructor(data: unknown) {
        super(Packets.Bubble, undefined, data);
    }
}
