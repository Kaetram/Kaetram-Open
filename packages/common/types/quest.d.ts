import type { PointerData } from './pointer';
import type { PopupData } from './popup';

export type Actor = 'player' | 'npc';
export type DialogueItem = string | { actor: string; text: string };

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

    /** Pointer information */
    pointer?: PointerData;

    /** Popup information */
    popup?: PopupData;

    /** If the stage grants the player an item. */
    itemKey?: string;
    itemCount?: number;
}

export interface RawQuest {
    name: string;
    description: string;
    stages: { [id: number]: RawStage };
}

export interface StageData {
    task: string;
    npc?: string;
    mob?: string[];
    mobCountRequirement: number; // how many mobs we need to kill to progress
    itemRequirement?: string;
    itemCountRequirement?: number; // how many of an item we need for progression
    text?: DialogueItem[];
    completedText?: string[];
    pointer?: PointerData;
    popup?: PopupData;
    itemKey?: string;
    itemCount?: number;
}

export interface QuestData {
    key: string;
    stage: number;
    subStage: number;
    stageCount: number;

    name?: string;
    description?: string;
}

export interface SerializedQuest {
    quests: QuestData[];
}

export type TaskType = 'talk' | 'kill' | 'pickup';
