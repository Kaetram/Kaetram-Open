import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class List extends Packet {
    public constructor(entityList: string[]) {
        super(Packets.List, undefined, entityList);
    }
}
