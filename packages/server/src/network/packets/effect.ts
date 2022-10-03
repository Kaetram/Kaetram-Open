import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { EffectPacket } from '@kaetram/common/types/messages/outgoing';

export default class Effect extends Packet {
    public constructor(opcode: Opcodes.Effect, data: EffectPacket) {
        super(Packets.Effect, opcode, data);
    }
}
