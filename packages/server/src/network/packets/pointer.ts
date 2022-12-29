import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';

export default class Pointer extends Packet {
    public constructor(opcode: Opcodes.Pointer, data?: unknown) {
        super(Packets.Pointer, opcode, data);
    }
}
