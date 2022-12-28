import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { FriendsPacket } from '@kaetram/common/types/messages/outgoing';

export default class Friends extends Packet {
    public constructor(opcode: Opcodes.Friends, data: FriendsPacket) {
        super(Packets.Friends, opcode, data);
    }
}
