import type { PointerData } from './pointer';
import type { PopupData } from './popup';

export type Actor = 'player' | 'npc';

export interface RawStage {
    task: string;
    npc?: string;

    /** Array of mob keys to kill. */
    mob?: string[];

    /** How many of mobs to be killed. */
    mobCountRequirement?: number;

    /** Item required in the inventory to progress to next stage. */
    itemRequirement?: string;

    /** How many of a given item we need to progress. */
    itemCountRequirement?: number;

    /** Text for the NPC. */
    text?: DialogueItem[];
    completedText?: string[];
    hasItemText?: string[]; // Text for if the player has a required item/count in the inventory.

    /** Pointer information */
    pointer?: PointerData;

    /** Popup information */
    popup?: PopupData;

    /** If the stage grants the player an item. */
    itemKey?: string;
    itemCount?: number;

    /** If the stage grants the user an ability. */
    ability?: string;
    abilityLevel?: number; // Sets an ability to a level.

    /** If a tree must be cut. */
    tree?: string;
    treeCount?: number; // Amount of tress to be cut.

    /** Skill experience rewards */
    skill?: string;
    experience?: number;
}

export interface RawQuest {
    name: string;
    description: string;
    rewards?: string[];
    hideNPCs?: string[]; // NPCs to hide after quest.-
    stages: { [id: number]: RawStage };
}

export interface StageData {
    task: string;
    npc?: string;
    mob?: string[];
    mobCountRequirement: number; // how many mobs we need to kill to progress
    itemRequirement?: string;
    itemCountRequirement?: number; // how many of an item we need for progression
    text?: string[];
    completedText?: string[];
    pointer?: PointerData;
    popup?: PopupData;
    itemKey?: string;
    itemCount?: number;
    ability?: string;
    abilityLevel?: number;
    tree?: string;
    treeCount?: number;
    skill?: string;
    experience?: number;
}

export interface QuestData {
    key: string;
    stage: number;
    subStage: number;

    name?: string;
    description?: string;
    rewards?: string[];
    stageCount?: number;
}

export interface SerializedQuest {
    quests: QuestData[];
}

export type TaskType = 'talk' | 'kill' | 'pickup' | 'tree';
