import Packet from '../packet';

import { Packets } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

export default class Map extends Packet {
    public constructor(data: unknown) {
        super(
            Packets.Map,
            undefined,
            Utils.compress(JSON.stringify(data)),
            Utils.getBufferSize(data)
        );
    }
}
