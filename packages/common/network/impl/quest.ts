import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { PointerData } from './pointer';
import type { PopupData } from '../../types/popup';

export interface QuestItem {
    key: string;
    count: number;
}

export interface SkillReward {
    key: string;
    experience: number;
}

export interface RawStage {
    task: string;
    npc?: string;

    subStages?: RawStage[];

    /** Array of mob keys to kill. */
    mob?: string[];

    /** How many of mobs to be killed. */
    mobCountRequirement?: number;

    /** Item required in the inventory to progress to next stage. */
    itemRequirements?: QuestItem[];

    /** The items that we are rewarding the player for the stage. */
    itemRewards?: QuestItem[];

    /** Text for the NPC. */
    text?: string[];
    completedText?: string[];
    hasItemText?: string[]; // Text for if the player has a required item/count in the inventory.

    /** Pointer information */
    pointer?: PointerData;

    /** Popup information */
    popup?: PopupData;

    /** If the stage grants the user an ability. */
    ability?: string;
    abilityLevel?: number; // Sets an ability to a level.

    /** If a tree must be cut. */
    tree?: string;
    treeCount?: number; // Amount of tress to be cut.

    /** If a fish must be caught */
    fish?: string;
    fishCount?: number;

    /** If a rock must be mined */
    rock?: string;
    rockCount?: number;

    /** Skill experience rewards */
    skillRewards?: SkillReward[];

    /** Timer information for the stage */
    timer?: number;
}

export interface RawQuest {
    name: string;
    description: string;
    rewards?: string[];
    difficulty?: string;
    skillRequirements?: { [key: string]: number }; // Skills required to start the quest.
    questRequirements?: string[]; // Quests required to start this quest.
    hideNPCs?: HideNPC; // NPCs to hide after quest.
    stages: { [id: number]: RawStage };
}

export interface StageData {
    task: string;
    npc?: string;
    subStages?: RawStage[];
    mob?: string[];
    mobCountRequirement: number; // how many mobs we need to kill to progress
    itemRequirements?: QuestItem[];
    itemRewards?: QuestItem[];
    text?: string[];
    completedText?: string[];
    pointer?: PointerData;
    popup?: PopupData;
    ability?: string;
    abilityLevel?: number;
    tree?: string;
    treeCount?: number;
    fish?: string;
    fishCount?: number;
    rock?: string;
    rockCount?: number;
    skillRewards?: SkillReward[];
    timer?: number;
}

export interface QuestData {
    key: string;
    stage: number;
    subStage: number;
    completedSubStages: string[];

    name?: string;
    description?: string;
    skillRequirements?: { [key: string]: number };
    questRequirements?: string[];
    rewards?: string[];
    difficulty?: string;
    stageCount?: number;
}

export interface QuestPacketData {
    key?: string;
    stage?: number;
    subStage?: number;
    quests?: QuestData[]; // Batch of quests
    interface?: Opcodes.Quest.Start; // Interface actions
}

export type QuestPacketCallback = (opcode: Opcodes.Quest, info: QuestPacketData) => void;

export interface SerializedQuest {
    quests: QuestData[];
}

export interface HideNPC {
    [key: string]: string;
}

export type TaskType = 'talk' | 'kill' | 'pickup' | 'tree';

export default class QuestPacket extends Packet {
    public constructor(opcode: Opcodes.Quest, data: QuestPacketData) {
        super(Packets.Quest, opcode, data);
    }
}
