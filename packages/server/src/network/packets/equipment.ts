import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { EquipmentPacket } from '@kaetram/common/types/messages/outgoing';

export default class Equipment extends Packet {
    public constructor(opcode: Opcodes.Equipment, data: EquipmentPacket) {
        super(Packets.Equipment, opcode, data);
    }
}
