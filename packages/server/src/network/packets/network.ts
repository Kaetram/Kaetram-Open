import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';

export default class Network extends Packet {
    public constructor(opcode: Opcodes.Network) {
        super(Packets.Network, opcode);
    }
}
