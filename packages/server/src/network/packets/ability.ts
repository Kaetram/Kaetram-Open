import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { AbilityPacket } from '@kaetram/common/types/messages/outgoing';

export default class Container extends Packet {
    public constructor(opcode: Opcodes.Ability, data: AbilityPacket) {
        super(Packets.Ability, opcode, data);
    }
}
