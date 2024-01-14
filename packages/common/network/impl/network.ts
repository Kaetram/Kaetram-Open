import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export interface NetworkPacketData {
    timestamp?: number;
}

export type NetworkPacketCallback = (opcode: Opcodes.Network, data?: NetworkPacketData) => void;

export default class NetworkPacket extends Packet {
    public constructor(opcode: Opcodes.Network, data?: NetworkPacketData) {
        super(Packets.Network, opcode, data);
    }
}
