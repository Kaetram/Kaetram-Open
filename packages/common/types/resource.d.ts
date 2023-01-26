export interface ResourceInfo {
    levelRequirement: number; // Required level to exhaust the resource
    experience: number; // Experience gained when exhausting the resource
    difficulty: number; // How hard it is to exhaust the resource
    item: string; // What you get when you exhaust the resource
    reqAchievement?: string; // Achievement required to exhaust the resource
    reqQuest?: string; // Quest required to exhaust the resource
    achievement?: string; // Achievement to be awarded when exhausting the resource (for first time).
    quest?: string; // Quest progress to be checked when exhausting the resource
}

export interface ResourceData {
    [key: string]: ResourceInfo;
}
