export interface Enchantment {
    level: number;
}

export interface Enchantments {
    [id: number]: Enchantment;
}

export interface ContainerItem {
    index: number;
    key: string;
    count: number;
    enchantments: Enchantments;
}

export interface Stats {
    crush: number;
    slash: number;
    stab: number;
    archery: number;
    magic: number;
}

export interface Bonuses {
    accuracy: number;
    strength: number;
    archery: number;
    magic: number;
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
    movementModifier?: number;
    lumberjacking?: number;
    mining?: number;
    healAmount?: number;
    healPercent?: number;
    manaAmount?: number;
    spriteName?: string;
    bonuses?: Bonuses;
    attackStats?: Stats;
    defenseStats?: Stats;
    undroppable?: boolean;
    respawnDelay?: number;
    attackRange?: number;
    projectileName?: string;
    description?: string;
    manaCost?: number;
    weaponType?: string;
}
