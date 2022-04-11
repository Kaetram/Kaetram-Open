export interface StoreItem {
    key: string;
    count: number;
    price: number;
    stockCount?: number;
}

export interface StoreInfo {
    items: StoreItem[]; // The items in the store.
    refresh: number; // How often the store refreshes.
    currency: string; // The currency used to buy items.
    lastUpdate?: number; // Last time the refresh took place.
}

export interface Store {
    [key: string]: StoreInfo;
}
