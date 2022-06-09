/**
 * Achievement data straight from the JSON file.
 */

export interface RawAchievement {
    name: string;
    description?: string;

    npc?: string; // NPC handing out the achievement.
    dialogueHidden?: string[]; // Dialogue to display before the achievement is discovered.
    dialogueStarted?: string[]; // Dialogue when the achievement has been started.

    mob?: string | string[]; // If the achievement requires a mob (or mobs) to be killed.
    mobCount?: number; // How many of the mobs to be killed.

    item?: string; // If the achievement requires an item to be found.
    itemCount?: number; // How much of an item to bring.

    rewardItem?: string; // String of the item we are rewarding.
    rewardItemCount?: number; // How much of the item to reward.

    rewardExperience?: number; // How much experience to reward.

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
    stage: number;
    stageCount?: number;
}

export interface SerializedAchievement {
    achievements: AchievementData[];
}
