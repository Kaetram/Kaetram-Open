import Packet from '../packet';

import { Packets } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

export type MapPacketCallback = (data: string) => void;

export default class MapPacket extends Packet {
    public constructor(data: unknown) {
        super(
            Packets.Map,
            undefined,
            Utils.compress(JSON.stringify(data)),
            Utils.getBufferSize(data)
        );
    }
}
