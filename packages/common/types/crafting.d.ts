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
    requirements: CraftingRequirement[];
    result: CraftingResult;
}

// Crafting JSON is just a dictionary that contains information about craftable items for each skill.
export interface CraftingInfo {
    [key: string]: { [key: string]: CraftingItem };
}
