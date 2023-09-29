import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export interface CommandPacketData {
    command: string;
}

export type CommandPacketCallback = (info: CommandPacketData) => void;

export default class CommandPacket extends Packet {
    public constructor(data: CommandPacketData) {
        super(Packets.Command, undefined, data);
    }
}
