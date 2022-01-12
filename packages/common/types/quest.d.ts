export interface RawStage {
    task: string;
    npc?: string;
    mob?: string | string[];
    withPointer?: boolean;
    countRequirement?: number;
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
    countRequirement: number;
}

export interface QuestData {
    key: string;
    stage: number;
    subStage: number;

    name?: string;
    description?: string;
    started?: boolean;
}

export interface SerializedQuest {
    quests: QuestData[];
}

export type TaskType = 'talk' | 'kill' | 'pickup';
