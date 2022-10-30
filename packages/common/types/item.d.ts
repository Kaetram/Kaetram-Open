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
    accuracy: number;
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
    achievement?: string; // Achievement required to use the item.
    quest?: string; // Quest requirement for the item.
    attackRate?: number;
    poisonous?: boolean;
    movementSpeed?: number;
    lumberjacking?: number;
    healAmount?: number;
    healPercent?: number;
    manaAmount?: number;
    spriteName?: string;
    bonuses?: Bonuses;
    attackStats?: Stats;
    defenseStats?: Stats;
    undroppable?: boolean;
}
