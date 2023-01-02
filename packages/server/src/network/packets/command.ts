import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { CommandPacket } from '@kaetram/common/types/messages/outgoing';

export default class Command extends Packet {
    public constructor(data: CommandPacket) {
        super(Packets.Command, undefined, data);
    }
}
