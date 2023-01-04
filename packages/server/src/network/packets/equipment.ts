import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { EquipmentPacket } from '@kaetram/common/types/messages/outgoing';

export default class Equipment extends Packet {
    public constructor(opcode: Opcodes.Equipment, data: EquipmentPacket) {
        super(Packets.Equipment, opcode, data);
    }
}
