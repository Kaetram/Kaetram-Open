import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Despawn extends Packet {
    public constructor(instance: string) {
        super(Packets.Despawn, undefined, instance);
    }
}
