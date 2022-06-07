import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class List extends Packet {
    public constructor(entities: string[]) {
        super(Packets.List, undefined, entities);
    }
}
