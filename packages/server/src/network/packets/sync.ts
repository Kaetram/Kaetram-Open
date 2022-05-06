import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Sync extends Packet {
    public constructor(data: unknown) {
        super(Packets.Sync, undefined, data);
    }
}
