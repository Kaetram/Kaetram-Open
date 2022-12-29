import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type { Opcodes } from '@kaetram/common/network';
import type { ContainerPacket } from '@kaetram/common/types/messages/outgoing';

export default class Container extends Packet {
    public constructor(opcode: Opcodes.Container, data: ContainerPacket) {
        super(Packets.Container, opcode, data);
    }
}
