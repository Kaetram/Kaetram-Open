import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
/**
 * Achievement data straight from the JSON file.
 */

export interface RawAchievement {
    name: string;
    description?: string;
    region?: string; // The region that the achievement belongs to.
    hidden?: boolean; // Whether or not to display description and achievement title.
    secret?: boolean; // Secret achievements are only displayed when completed.

    npc?: string; // NPC handing out the achievement.
    dialogueHidden?: string[]; // Dialogue to display before the achievement is discovered.
    dialogueStarted?: string[]; // Dialogue when the achievement has been started.

    mob?: string | string[]; // If the achievement requires a mob (or mobs) to be killed.
    mobCount?: number; // How many of the mobs to be killed.

    item?: string; // If the achievement requires an item to be found.
    itemCount?: number; // How much of an item to bring.

    rewardItem?: string; // String of the item we are rewarding.
    rewardItemCount?: number; // How much of the item to reward.

    rewardSkill?: string; // Skill we are rewarding experience in.
    rewardExperience?: number; // How much experience to reward.

    rewardAbility?: string; // Key of the ability that is being rewarded.
    rewardAbilityLevel?: number; // Optional, otherwise defaults to 1.

    // Experience reward to skills will be added later.
}

/**
 * Achievement data object that can be stored in the database
 * or relayed to the server. The optional parameters are used
 * when batching the data to the client.
 */

export interface AchievementData {
    key: string;
    name?: string;
    description?: string;
    region?: string;
    stage: number;
    stageCount?: number;
    secret?: boolean;
}

export interface SerializedAchievement {
    achievements: AchievementData[];
}

export interface AchievementPacketData {
    key?: string;
    name?: string;
    description?: string;
    stage?: number;
    achievements?: AchievementData[];
}

export type AchievementPacketCallback = (
    opcode: Opcodes.Achievement,
    info: AchievementPacketData
) => void;
export default class AchievementPacket extends Packet {
    public constructor(opcode: Opcodes.Achievement, data: AchievementPacketData) {
        super(Packets.Achievement, opcode, data);
    }
}
