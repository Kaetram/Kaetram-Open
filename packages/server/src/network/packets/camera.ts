import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';

export default class Camera extends Packet {
    public constructor(opcode: Opcodes.Camera) {
        super(Packets.Camera, opcode);
    }
}
