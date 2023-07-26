import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export interface PointerData {
    type: number;
    x?: number;
    y?: number;
    instance?: string;
    button?: string;
}

export interface PointerPacketData {
    instance: string;
    x?: number;
    y?: number;
    button?: string;
}

export type PointerPacketCallback = (opcode: Opcodes.Pointer, info: PointerPacketData) => void;

export default class PointerPacket extends Packet {
    public constructor(opcode: Opcodes.Pointer, data?: unknown) {
        super(Packets.Pointer, opcode, data);
    }
}
