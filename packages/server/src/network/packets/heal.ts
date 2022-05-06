import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Heal extends Packet {
    public constructor(data: unknown) {
        super(Packets.Heal, undefined, data);
    }
}
