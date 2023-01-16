import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { EffectPacket } from '@kaetram/common/types/messages/outgoing';

export default class Effect extends Packet {
    public constructor(opcode: Opcodes.Effect, data: EffectPacket) {
        super(Packets.Effect, opcode, data);
    }
}
