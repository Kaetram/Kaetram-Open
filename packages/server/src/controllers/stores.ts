import _ from 'lodash';

import World from '../game/world';

import storeData from '../../data/stores.json';

import log from '@kaetram/common/util/log';

import NPC from '../game/entity/npc/npc';
import Item from '../game/entity/objects/item';
import Player from '../game/entity/character/player/player';

import { Opcodes } from '@kaetram/common/network';
import { Store as StorePacket } from '../network/packets';
import type {
    SerializedStoreInfo,
    SerializedStoreItem,
    StoreData,
    StoreItem
} from '@kaetram/common/types/stores';

interface StoreInfo {
    items: Item[];
    refresh: number;
    currency: string;
    lastUpdate?: number;
}

interface Store {
    [key: string]: StoreInfo;
}

/**
 * Shops are globally controlled and updated
 * by the world. When a player purchases an item,
 * we relay that information to the rest of the players.
 */

export default class Stores {
    private stores: Store = {}; // Key is a string representing the store's name in `stores.json`.

    private updateFrequency = 20_000; // Update every 20 seconds

    public constructor(private world: World) {
        // Load stores from the JSON.
        _.each(storeData, this.load.bind(this));
        //_.each(shopData, (store: StoreInfo, key: string) => (this.stores[key] = store));

        // Set up an interval for refreshing the store data.
        setInterval(this.update.bind(this), this.updateFrequency);

        log.info(
            `Loaded ${Object.keys(this.stores).length} shop${
                Object.keys(this.stores).length > 1 ? 's' : ''
            }.`
        );
    }

    /**
     * Update function called at a `this.`updateFrequency` interval.
     */

    private update(): void {
        _.each(this.stores, (store: StoreInfo) => {
            if (!this.canRefresh(store)) return;

            this.stockItems(store);

            store.lastUpdate = Date.now();
        });
    }

    /**
     * Loads a store by converting the JSON data into a `StoreInfo` object.
     * We create an instance of every object we are trying to load.
     * @param store Raw store data pulled from the JSON.
     * @param key The key of the store data.
     */

    private load(store: StoreData, key: string): void {
        let { refresh, currency } = store,
            items: Item[] = [];

        _.each(store.items, (item: StoreItem) => {
            let storeItem = new Item(item.key, -1, -1, false, item.count);

            // Assign price if provided, otherwise use default item price.
            if (item.price) storeItem.price = item.price;

            // Stocking amount and max amount of the item in store.
            storeItem.stockAmount = item.stockAmount || 1;
            storeItem.maxCount = item.count;

            items.push(storeItem);
        });

        this.stores[key] = {
            items,
            refresh,
            currency,
            lastUpdate: Date.now()
        };
    }

    /**
     * Iterates through all the items in the store and increments
     * them by one.
     * @param store The store we are incrementing item counts of.
     */

    private stockItems(store: StoreInfo): void {
        _.each(store.items, (item: Item) => {
            if (item.count >= item.maxCount) return;

            // If an alternate optional stock count is provided, increment by that amount.
            item.count += item.stockAmount;
        });
    }

    public open(player: Player, npc: NPC): void {
        let store = this.getStore(npc);

        if (!store) return log.debug(`[${player.username}] Tried to open a non-existent store.`);

        player.send(new StorePacket(Opcodes.Store.Open, this.serialize(npc.store)));
    }

    /**
     * Handles the purchasing of an item from the store. If successful,
     * decrements the item count in the store by the count specified, and
     * sends the data to all the players accessing the store.
     * @param player The player that is purchasing the item.
     * @param id The store that the item is being purchased from.
     * @param key The key of the item being purchased.
     * @param count The amount of the item being purchased.
     */

    public purchase(player: Player, id: number, key: string, count: number): void {
        let store = this.stores[id];

        // Check if store exists.
        if (!store)
            return log.error(
                `Player ${player.username} tried to purchase from a non-existent store with ID: ${id}.`
            );

        let item = _.find(store.items, { key });

        // Check if item exists
        if (!item)
            return log.error(
                `Player ${player.username} tried to purchase an item that doesn't exist in store ID: ${id}.`
            );

        let currency = player.inventory.getIndex(store.currency, item.price);

        if (currency === -1)
            return player.notify(`You don't have enough ${store.currency} to purchase this item.`);
    }

    /**
     * Checks if the store can refresh the items or not. Essentially
     * checks for whether or not the refresh time has passed since the
     * last update commenced. If this is the first update, we default
     * to 0.
     * @param store The store we are checking.
     * @returns If the difference in time between now and last update is greater than refresh time.
     */

    private canRefresh(store: StoreInfo): boolean {
        return Date.now() - (store.lastUpdate || 0) > store.refresh;
    }

    /**
     * Gets a store based on an NPC, otherwise returns undefined.
     * @param npc The NPC we are trying to find the store of.
     * @returns The store of the NPC, or undefined if it doesn't exist.
     */

    public getStore(npc: NPC): StoreInfo | undefined {
        if (!(npc.store in this.stores)) return undefined;

        return this.stores[npc.store];
    }

    /**
     * Takes the key of a store and produces a serialized version
     * of the data contained in it. It extracts minimalized data containing
     * absolutely necessary information for the client to display to the player.
     * @param key The key of the store we are trying to serialize.
     * @returns A serialized version of the store containing minimal data.
     */

    public serialize(key: string): SerializedStoreInfo {
        let store = this.stores[key],
            items: SerializedStoreItem[] = [];

        // Extract all the items from the store.
        _.each(store.items, (item: Item) => {
            items.push({
                key: item.key,
                name: item.name,
                count: item.count,
                price: item.price
            });
        });

        return {
            items,
            currency: store.currency
        };
    }
}
