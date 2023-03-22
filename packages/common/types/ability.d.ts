import type { Modules } from '../network';

// Raw ability information from the JSON file.

export interface RawAbilityLevelData {
    cooldown?: number;
    duration?: number;
    mana?: number;
}

export interface RawAbilityData {
    type: string;
    levels?: { [level: number]: RawAbilityLevelData };
}

export interface RawAbility {
    [key: string]: RawAbilityInfo;
}

// Object ability information

export interface AbilityData {
    key: string;
    level: number;
    quickSlot?: number;
    type?: Modules.AbilityType;
}

export interface SerializedAbility {
    abilities: AbilityData[];
}
