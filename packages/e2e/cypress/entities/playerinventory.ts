import type { PlayerInventorySlot } from './playerinventoryslot';

export interface PlayerInventory {
    username: string;
    slots: PlayerInventorySlot[];
}
