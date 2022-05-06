import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Animation extends Packet {
    public constructor(data: unknown) {
        super(Packets.Animation, undefined, data);
    }
}
