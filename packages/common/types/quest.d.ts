import { PointerData } from './pointer.d';

export interface RawStage {
    task: string;
    npc?: string;
    /** Array of mob keys to kill. */
    mob?: string[];
    /** If to display a pointer at a location. */
    withPointer?: boolean;
    itemRequirement?: string;
    /** How many of mobs to be killed. */
    countRequirement?: number;
    /** Text for the NPC. */
    text?: string[];
    completedText?: string[];
    pointer?: PointerData;
}

export interface RawQuest {
    name: string;
    description: string;
    stages: { [id: number]: RawStage };
}

export interface StageData {
    task: string;
    npc?: string;
    mob?: string | string[];
    itemRequirement?: string;
    countRequirement?: number; // how many mobs to kill or how many of an item to have
    text?: string[];
    completedText?: string[];
    pointer?: PointerData;
}

export interface QuestData {
    key: string;
    stage: number;
    subStage: number;

    name?: string;
    description?: string;
    started?: boolean;
    finished?: boolean;
}

export interface SerializedQuest {
    quests: QuestData[];
}

export type TaskType = 'talk' | 'kill' | 'pickup';
