import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { PlayerPacket } from '@kaetram/common/types/messages/hub';

export default class Player extends Packet {
    public constructor(opcode: Opcodes.Player, data?: PlayerPacket) {
        super(Packets.Player, opcode, data);
    }
}
