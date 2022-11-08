import { Enchantments } from './item';

export type SlotType = 'inventory' | 'bank';

export interface SerializedContainer {
    username?: string;
    slots: SlotData[];
}

export interface SlotData {
    index: number;
    key: string;
    count: number;
    enchantments: Enchantments;
    name?: string;
    edible?: boolean;
    equippable?: boolean;
    price?: number;
}
