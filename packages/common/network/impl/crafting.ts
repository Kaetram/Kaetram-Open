import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules, Opcodes } from '@kaetram/common/network';

export interface CraftingItemPreview {
    key: string;
    level: number;
}
export interface CraftingRequirement {
    key: string;
    count: number;
    name?: string;
}

export interface CraftingResult {
    count: number;
}

export interface CraftingItem {
    level: number;
    experience: number;
    chance?: number; // Out of 100 chance of success
    requirements: CraftingRequirement[];
    result: CraftingResult;
}

// Crafting JSON is just a dictionary that contains information about craftable items for each skill.
export interface CraftingInfo {
    [key: string]: { [key: string]: CraftingItem };
}

export interface CraftingPacketData {
    type?: Modules.Skills;
    previews?: CraftingItemPreview[]; // The keys of the items we are crafting.
    key?: string; // The key of the item we are crafting.
    name?: string;
    level?: number; // The level required to craft the item.
    requirements?: CraftingRequirement[];
    result?: number; // The amount the item we are crafting will give.
}

export type CraftingPacketCallback = (opcode: Opcodes.Crafting, info: CraftingPacketData) => void;

export default class CraftingPacket extends Packet {
    public constructor(opcode: Opcodes.Crafting, data: CraftingPacketData) {
        super(Packets.Crafting, opcode, data);
    }
}
