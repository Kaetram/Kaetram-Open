import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Points extends Packet {
    public constructor(data: unknown) {
        super(Packets.Points, undefined, data);
    }
}
