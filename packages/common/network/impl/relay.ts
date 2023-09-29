import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export default class RelayPacket extends Packet {
    public constructor(username: string, packet: Packet) {
        super(Packets.Relay, undefined, [username, [...(packet.serialize() as unknown[])]]);
    }
}
