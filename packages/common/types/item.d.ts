export interface Enchantment {
    level: number;
}

export interface Enchantments {
    [id: number]: Enchantment;
}

export interface Light {
    outer?: LampData;
    inner?: LampData;
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

// This is for items that have a lamp effect.
export interface LampData {
    distance: number;
    colour: string;

    flickerSpeed: number;
    flickerIntensity: number;
}

export interface ItemData {
    type: string;
    name: string;
    stackable?: boolean;
    edible?: boolean;
    interactable?: boolean;
    maxStackSize?: number;
    plugin?: string;
    price?: number;
    storeCount?: number;
    skill?: string; // Skill requirement for the item.
    level?: number; // Requirement level for the item.
    achievement?: string; // Achievement required to use the item.
    quest?: string; // Quest requirement for the item.
    attackRate?: number;
    twoHanded?: boolean;
    poisonous?: boolean;
    freezing?: boolean;
    burning?: boolean;
    light?: Light;
    movementModifier?: number;
    lumberjacking?: number;
    mining?: number;
    fishing?: number;
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
    smallBowl?: boolean;
    mediumBowl?: boolean;
    pet?: string;
    effect?: string;
    duration?: number;
    activeAbility?: {
        name: string;       // Name of the active ability
        manaCost: number;   // Mana cost of the ability
        cooldown: number;   // Cooldown duration for the ability
    };
}
