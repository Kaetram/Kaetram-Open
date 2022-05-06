export type SlotType = 'inventory' | 'bank';

export interface SerializedContainer {
    username?: string;
    slots: SlotData[];
}

export interface SlotData {
    index: number;
    key: string;
    count: number;
    name?: string;
    ability?: number;
    abilityLevel?: number;

    edible?: boolean;
    equippable?: boolean;
    price?: number;
}
