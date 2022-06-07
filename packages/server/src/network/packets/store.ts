import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { StorePacket } from '@kaetram/common/types/messages/outgoing';

export default class Store extends Packet {
    public constructor(opcode: Opcodes.Store, data: StorePacket) {
        super(Packets.Store, opcode, data);
    }
}
