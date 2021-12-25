import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Command extends Packet {
    public constructor(data: unknown) {
        super(Packets.Command, undefined, data);
    }
}
