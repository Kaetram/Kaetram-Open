import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

export default class List extends Packet {
    public constructor(entities: string[]) {
        super(Packets.List, undefined, entities);
    }
}
