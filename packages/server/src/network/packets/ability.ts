import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { AbilityPacket } from '@kaetram/common/types/messages/outgoing';

export default class Container extends Packet {
    public constructor(opcode: Opcodes.Ability, data: AbilityPacket) {
        super(Packets.Ability, opcode, data);
    }
}
