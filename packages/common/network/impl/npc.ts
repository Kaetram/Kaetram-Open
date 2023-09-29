import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { SlotData } from '@kaetram/common/types/slot';

export interface NPCData {
    name?: string;
    text?: string[];
    role?: string;
    store?: string;
}

export interface NPCPacketData {
    instance?: string; // Used when an NPC sends a text message.
    text?: string; // Message to display in a bubble.
    slots?: SlotData[]; // When opening a bank NPC.
}

export type NPCPacketCallback = (opcode: Opcodes.NPC, info: NPCPacketData) => void;

export default class NPCPacket extends Packet {
    public constructor(opcode: Opcodes.NPC, data: unknown) {
        super(Packets.NPC, opcode, data);
    }
}
