import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import { EntityUpdate } from '@kaetram/common/types/entity';

export default class Update extends Packet {
    public constructor(data?: EntityUpdate[]) {
        super(Packets.Update, undefined, data);
    }
}
