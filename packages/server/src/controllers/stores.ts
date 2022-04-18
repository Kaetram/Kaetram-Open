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

        // Set up an interval for refreshing the store data.
        setInterval(this.update.bind(this), this.updateFrequency);

        log.info(
            `Loaded ${Object.keys(this.stores).length} shop${
                Object.keys(this.stores).length > 1 ? 's' : ''
            }.`
        );
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
            // Skip if an item already exists with the same key.
            if (_.some(items, { key: item.key }))
                return log.warning(`Duplicate item key found in store: '${key}'.`);

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
     * Update function called at a `this.`updateFrequency` interval.
     */

    private update(): void {
        _.each(this.stores, (store: StoreInfo, key: string) => {
            if (!this.canRefresh(store)) return;

            this.stockItems(store);
            this.updatePlayers(key);

            store.lastUpdate = Date.now();
        });
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

    /**
     * Iterates through all the players in the world and finds
     * which ones have a specific shop open. If they do, we send
     * an update packet to refresh the store's stock.
     * @param key The key of the store we are checking/updating.
     */

    private updatePlayers(key: string): void {
        this.world.entities.forEachPlayer((player: Player) => {
            if (player.storeOpen !== key) return;

            // Update packet to players with the store open.
            player.send(new StorePacket(Opcodes.Store.Update, this.serialize(key)));
        });
    }

    /**
     * Opens a shop for a player by first checking if a store is available
     * from a specified NPC. Sends a packet to the client and updates the
     * player's currently open store variable. This variable resets to an
     * empty string as soon as the player moves.
     * @param player The player we are opening the store for.
     * @param npc The NPC we are grabbing store data from.
     */

    public open(player: Player, npc: NPC): void {
        let store = this.getStore(npc);

        if (!store) return log.debug(`[${player.username}] Tried to open a non-existent store.`);

        player.send(new StorePacket(Opcodes.Store.Open, this.serialize(npc.store)));

        player.storeOpen = npc.store;
    }

    /**
     * Handles the purchasing of an item from the store. If successful,
     * decrements the item count in the store by the count specified, and
     * sends the data to all the players accessing the store.
     * @param player The player that is purchasing the item.
     * @param storeKey The key of the store the item is being purchased from.
     * @param itemKey The key of the item being purchased.
     * @param count The amount of the item being purchased.
     */

    public purchase(player: Player, storeKey: string, itemKey: string, count = 1): void {
        if (player.storeOpen !== storeKey)
            return log.warning(
                `[${player.username}] Tried to purchase from a store that isn't open.`
            );

        let store = this.stores[storeKey];

        // Check if store exists.
        if (!store)
            return log.error(
                `Player ${player.username} tried to purchase from a non-existent store with ID: ${storeKey}.`
            );

        let item = _.find(store.items, { key: itemKey });

        // Check if item exists
        if (!item)
            return log.error(
                `Player ${player.username} tried to purchase an item that doesn't exist in store: ${storeKey}.`
            );

        // Prevent buying more than store has stock. Default to max stock.
        count = item.count < count ? item.count : count;

        // Find total price of item by multiplying count against price.
        let currency = player.inventory.getIndex(store.currency, item.price * count);

        if (currency === -1)
            return player.notify(`You don't have enough ${store.currency} to purchase this item.`);

        // Check against item stackability or if there is space in the inventory.
        if (!player.inventory.canHold(item) || !player.inventory.hasSpace())
            return player.notify(`You don't have enough inventory space to purchase this item.`);

        // Clone the item we are adding
        let itemToAdd = _.clone(item);

        itemToAdd.count = count;

        // Decrement the item count by the amount we are buying.
        item.count -= count;

        // Add the item to the player's inventory.
        player.inventory.add(itemToAdd);
    }

    /**
     * Checks if the store can refresh the items or not. Essentially
     * checks for whether or not the refresh time has passed since the
     * last update commenced. If this is the first update, we default to 0.
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
        _.each(store.items, (item: Item) =>
            items.push({
                key: item.key,
                name: item.name,
                count: item.count,
                price: item.price
            })
        );

        return {
            key,
            items,
            currency: store.currency
        };
    }
}
