import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Teleport extends Packet {
    public constructor(data: unknown) {
        super(Packets.Teleport, undefined, data);
    }
}
