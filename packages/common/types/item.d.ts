export interface ContainerItem {
    index: number;
    key: string;
    count: number;
    ability?: number;
    abilityLevel?: number;
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
    attackLevel?: number;
    defenseLevel?: number;
    pendantLevel?: number;
    ringLevel?: number;
    bootsLevel?: number;
    attackRate?: number;
    movementSpeed?: number;
    lumberjacking?: number;
    healAmount?: number;
    healPercent?: number;
    manaAmount?: number;
}
