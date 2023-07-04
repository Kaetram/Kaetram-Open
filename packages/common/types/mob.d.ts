import type { Bonuses, Stats } from '@kaetram/common/types/item';

export interface MobSkills {
    accuracy: number;
    strength: number;
    defense: number;
    magic: number;
    archery: number;
}

export interface MobData {
    name: string;
    description?: string | string[];
    hitPoints?: number;
    drops?: { [itemKey: string]: number };
    dropTables?: string[];
    level?: number;
    skills?: MobSkills;
    attackLevel?: number;
    attackStats?: Stats;
    defenseStats?: Stats;
    bonuses?: Bonuses;
    attackRange?: number;
    aggroRange?: number;
    aggressive?: boolean;
    alwaysAggressive?: boolean;
    attackRate?: number;
    respawnDelay?: number;
    movementSpeed?: number;
    poisonous?: boolean;
    freezing?: boolean;
    burning?: boolean;
    hiddenName?: boolean;
    projectileName?: string;
    roaming?: boolean;
    plugin?: string;
    achievement?: string;
    boss?: boolean;
    miniboss?: boolean;
    roamDistance?: number;
    healRate?: number;
}

export interface RawData {
    [key: string]: MobData;
}
