import { Packets } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import Packet from '../packet';

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
