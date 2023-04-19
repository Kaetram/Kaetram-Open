export interface CraftingRequirement {
    key: string;
    count: number;
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
