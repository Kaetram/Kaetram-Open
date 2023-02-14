export interface MobData {
    name: string;
    description?: string | string[];
    hitPoints?: number;
    drops?: { [itemKey: string]: number };
    dropTables?: string[];
    level?: number;
    attackLevel?: number;
    defenseLevel?: number;
    attackRange?: number;
    aggroRange?: number;
    aggressive?: boolean;
    alwaysAggressive?: boolean;
    attackRate?: number;
    respawnDelay?: number;
    movementSpeed?: number;
    poisonous?: boolean;
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
