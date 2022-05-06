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
    requirement?: number; // enhance this at some point
    attackLevel?: number;
    defenseLevel?: number;
    pendantLevel?: number;
    ringLevel?: number;
    bootsLevel?: number;
    movementSpeed?: number;
    lumberjacking?: number;
}
