export interface AbilityLevelData {
    cooldown?: number;
    duration?: number;
    mana?: number;
}

export interface AbilityInfo {
    type: string;
    levels?: { [level: number]: AbilityLevelData };
}

export type AbilityData = { [key: string]: AbilityInfo };

export interface SerializedAbility {
    key: string;
    level: number;
}

export interface SerializedAbilities {
    abilities: SerializedAbility[];
    quickSlots: string[];
}
