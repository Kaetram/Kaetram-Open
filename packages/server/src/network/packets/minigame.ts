import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { MinigamePacket } from '@kaetram/common/types/messages/outgoing';

export default class Minigame extends Packet {
    public constructor(opcode: Opcodes.Minigame, data?: MinigamePacket) {
        super(Packets.Minigame, opcode, data);
    }
}
