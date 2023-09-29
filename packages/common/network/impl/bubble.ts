import Packet from '../packet';

import { Opcodes, Packets } from '@kaetram/common/network';

export interface BubblePacketData {
    instance: string;
    text: string;
    duration?: number;
    x?: number;
    y?: number;
}

export type BubblePacketCallback = (opcode: Opcodes.Bubble, info: BubblePacketData) => void;

export default class BubblePacket extends Packet {
    public constructor(data: unknown, opcode = Opcodes.Bubble.Entity) {
        super(Packets.Bubble, opcode, data);
    }
}
