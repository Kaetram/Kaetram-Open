import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export type ConnectedPacketCallback = () => void;

export default class ConnectedPacket extends Packet {
    public constructor() {
        super(Packets.Connected);
    }
}
