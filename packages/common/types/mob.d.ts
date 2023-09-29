import type { Bonuses, Stats } from '@kaetram/common/types/item';

// The mobs.json drops structure.
export interface MobDrop {
    key: string;
    count?: number; // Defaults to 1 if undefined.
    chance: number;
    variable?: boolean; // Whether or not the drop amount is randomized.
    // Quest and achievement requirements.
    quest?: string;
    achievement?: string;
    status?: 'started' | 'notstarted'; // Optional parameter for when to drop item given quest/achievement.
}

export interface MobDropTable {
    drops: MobDrop[];
    achievement?: string; // Achievement that has to be finished to unlock the drop table.
    quest?: string; // Quest that must be completed to unlock drop table.
}

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
    drops?: MobDrop[];
    dropTables?: string[];
    level?: number;
    skills?: MobSkills;
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

export interface RawMobData {
    [key: string]: MobData;
}
