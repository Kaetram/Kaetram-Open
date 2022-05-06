import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Notification extends Packet {
    public constructor(opcode: Opcodes.Notification, data: unknown) {
        super(Packets.Notification, opcode, data);
    }
}
