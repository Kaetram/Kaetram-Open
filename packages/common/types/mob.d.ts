export interface MobData {
    //id: number;
    //key: string;
    name: string;
    experience?: number;
    hitPoints?: number;
    drops?: { [itemKey: string]: number };
    level?: number;
    attackLevel?: number;
    defenseLevel?: number;
    attackRange?: number;
    aggroRange?: number;
    aggressive?: boolean;
    attackRate?: number;
    respawnDelay?: number;
    movementSpeed?: number;
    poisonous?: boolean;
    hiddenName?: boolean;
    projectileName?: string;
    roaming?: boolean;
    plugin?: string;
    achievement?: string;
    miniboss?: boolean;
}
