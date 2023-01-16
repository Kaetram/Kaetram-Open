import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export default class Pointer extends Packet {
    public constructor(opcode: Opcodes.Pointer, data?: unknown) {
        super(Packets.Pointer, opcode, data);
    }
}
