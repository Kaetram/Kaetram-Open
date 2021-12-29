export interface SerializedContainer {
    username?: string;
    slots: SlotData[];
}

export interface SlotData {
    index: number;
    key: string;
    count: number;
    ability: number;
    abilityLevel: number;

    edible?: boolean;
    equippable?: boolean;
}
