export interface ContainerItem {
    index: number;
    key: string;
    count: number;
    ability?: number;
    abilityLevel?: number;
}

export interface Stats {
    crush: number;
    slash: number;
    stab: number;
    magic: number;
}

export interface Bonuses {
    dexterity: number;
    strength: number;
    archery: number;
}

export interface ItemData {
    type: string;
    name: string;
    stackable?: boolean;
    edible?: boolean;
    maxStackSize?: number;
    plugin?: string;
    price?: number;
    storeCount?: number;
    skill?: string; // Skill requirement for the item.
    level?: number; // Requirement level for the item.
    attackRate?: number;
    movementSpeed?: number;
    lumberjacking?: number;
    healAmount?: number;
    healPercent?: number;
    manaAmount?: number;
    bonuses?: Bonuses;
    attackStats?: Stats;
    defenseStats?: Stats;
}
