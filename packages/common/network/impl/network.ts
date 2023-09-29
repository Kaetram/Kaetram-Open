import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export type NetworkPacketCallback = (opcode?: Opcodes.Network) => void;

export default class NetworkPacket extends Packet {
    public constructor(opcode: Opcodes.Network) {
        super(Packets.Network, opcode);
    }
}
