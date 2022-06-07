import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import { ContainerPacket } from '@kaetram/common/types/messages/outgoing';

export default class Container extends Packet {
    public constructor(opcode: Opcodes.Container, data: ContainerPacket) {
        super(Packets.Container, opcode, data);
    }
}
