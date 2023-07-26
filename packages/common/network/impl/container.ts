import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules, Opcodes } from '@kaetram/common/network';
import type { SerializedContainer, SlotData } from '@kaetram/common/types/slot';

export interface ContainerPacketData {
    type: Modules.ContainerType;
    data?: SerializedContainer; // Batch data
    slot?: SlotData; // Used for adding or removing an item to the container.
}

export type ContainerPacketCallback = (
    opcode: Opcodes.Container,
    info: ContainerPacketData
) => void;

export default class ContainerPacket extends Packet {
    public constructor(opcode: Opcodes.Container, data: ContainerPacketData) {
        super(Packets.Container, opcode, data);
    }
}
