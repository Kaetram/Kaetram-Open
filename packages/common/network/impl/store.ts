import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

/// INFO FROM THE STORE JSON ///

export interface StoreItem {
    key: string;
    count: number;
    price?: number;
    stockAmount?: number;
}

export interface StoreData {
    items: StoreItem[]; // The items in the store.
    refresh: number; // How often the store refreshes.
    currency: string; // The currency used to buy items.
    restricted?: boolean;
}

export interface RawStore {
    [key: string]: StoreData;
}

//////////////////////////////////////////

export interface SerializedStoreItem {
    key: string;
    name: string;
    count: number;
    price: number;
    index?: number;
}

export interface SerializedStoreInfo {
    key: string; // Store's key
    currency: string; // Store's currency
    items: SerializedStoreItem[]; // Serialized store items.
}

export interface StorePacketData {
    key?: string;
    currency?: string;
    item?: SerializedStoreItem; // Used for selecting items.
    items?: SerializedStoreItem[]; // Used for batch data.
}

export type StorePacketCallback = (opcode: Opcodes.Store, info: StorePacketData) => void;

export default class StorePacket extends Packet {
    public constructor(opcode: Opcodes.Store, data: StorePacketData) {
        super(Packets.Store, opcode, data);
    }
}
