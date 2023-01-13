import type { Bonuses, Enchantments, Stats } from './item';

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
    description?: string;
    edible?: boolean;
    equippable?: boolean;
    price?: number;
    attackStats?: Stats;
    defenseStats?: Stats;
    bonuses?: Bonuses;
}
