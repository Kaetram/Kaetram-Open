import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export interface EntityListPacketData {
    entities?: string[]; // List of entity instances to be checked in the client.
    positions?: { [instance: string]: Position }; // List of entity positions to verify.
}

export type EntityListPacketCallback = (opcode: Opcodes.List, info: EntityListPacketData) => void;

export default class ListPacket extends Packet {
    public constructor(opcode: Opcodes.List, info: EntityListPacketData) {
        super(Packets.List, opcode, info);
    }
}
