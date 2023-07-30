import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules, Opcodes } from '@kaetram/common/network';

/** Raw ability information from the JSON file. */
export interface RawAbilityLevelData {
    cooldown?: number;
    duration?: number;
    mana?: number;
}

export interface RawAbilityData {
    type: string;
    levels?: { [level: number]: RawAbilityLevelData };
}

export interface RawAbility {
    [key: string]: RawAbilityData;
}

/** Object ability information. */
export interface AbilityData {
    key: string;
    level: number;
    quickSlot?: number;
    type?: Modules.AbilityType;
}

export interface SerializedAbility {
    abilities: AbilityData[];
}

export type AbilityPacketData = SerializedAbility | AbilityData;

export type AbilityPacketCallback = (opcode: Opcodes.Ability, info: AbilityPacketData) => void;

export default class AbilityPacket extends Packet {
    public constructor(opcode: Opcodes.Ability, data: AbilityPacketData) {
        super(Packets.Ability, opcode, data);
    }
}
