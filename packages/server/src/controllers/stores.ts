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
    StoreItem,
    RawStore
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
        if (!this.verifyStore(player, storeKey)) return;

        let store = this.stores[storeKey],
            item = _.find(store.items, { key: itemKey });

        // Check if item exists
        if (!item)
            return log.error(
                `Player ${player.username} tried to purchase an item that doesn't exist in store: ${storeKey}.`
            );

        if (item.count < 1) return player.notify(`This item is currently out of stock.`);

        // Prevent buying more than store has stock. Default to max stock.
        count = item.count < count ? item.count : count;

        // Find total price of item by multiplying count against price.
        let currency = player.inventory.getIndex(store.currency, item.price * count);

        if (currency === -1)
            return player.notify(`You don't have enough ${store.currency} to purchase this item.`);

        // Clone the item we are adding
        let itemToAdd = _.clone(item);

        itemToAdd.count = count;

        // Add the item to the player's inventory.
        if (!player.inventory.add(itemToAdd))
            return player.notify(`You don't have enough inventory space to purchase this item.`);

        // Decrement the item count by the amount we are buying.
        item.count -= count;

        // Remove item from store if it is out of stock and not original to the store.
        if (item.count < 1 && this.isOriginalItem(storeKey, item.key))
            store.items = _.filter(store.items, (storeItem) => {
                return storeItem.key !== itemKey;
            });

        player.inventory.remove(currency, item.price * count);

        // Sync up new store data to all players.
        this.updatePlayers(storeKey);
    }

    /**
     * Sells an item to the store. Certain stores are allowed to accept
     * items they do not originally have in stock. In that case we add
     * the specific item to the stock.
     * @param player The player that is selling the item.
     * @param storeKey The store the player is selling to.
     * @param itemKey The item the player is selling.
     * @param count The amount of the item being sold.
     */

    public sell(player: Player, storeKey: string, itemKey: string, count = 1, index: number): void {
        if (!this.verifyStore(player, storeKey)) return;

        let store = this.stores[storeKey],
            item = player.inventory.getItem(player.inventory.get(index));

        if (item.key !== itemKey)
            return log.warning(`Player ${player.username} tried to sell an invalid item.`);

        // Check if store already contains the item.
        let storeItem = _.find(store.items, { key: itemKey }),
            price = storeItem ? storeItem.price : item.price;

        player.inventory.remove(index, count);

        // Attempt to add currency type and amount to the player's inventory.
        if (!player.inventory.add(this.getCurrency(store.currency, Math.ceil((price * count) / 2))))
            return player.notify(`You don't have enough inventory space to sell this item.`);

        // Increment item amount in the store otherwise add item to store.
        if (storeItem) storeItem.count += count;
        else store.items.push(item);

        // Sync up new store data to all players.
        this.updatePlayers(storeKey);
    }

    /**
     * When selecting an item in the inventory, we just check the price of the item
     * in the player's inventory and return the result back. If the item is in the store
     * then we refer to that price instead.
     * @param player The player we are selecting an item for sale of.
     * @param storeKey The store that the action takes place in.
     * @param itemKey The key of the item attempted to be sold.
     * @param index The selected inventory slot index from the client (used for verification).
     */

    public select(
        player: Player,
        storeKey: string,
        itemKey: string,
        count = 1,
        index: number
    ): void {
        if (!this.verifyStore(player, storeKey) || isNaN(index)) return;

        let store = this.stores[storeKey],
            item = _.find(store.items, { key: itemKey });

        // Check if item exists
        if (!item) item = player.inventory.getItem(player.inventory.get(index));

        if (item.key === store.currency) return player.notify(`You cannot sell this item.`);

        if (item.key !== itemKey)
            return log.warning(`[${player.username}] Invalid item index selection.`);

        player.send(
            new StorePacket(Opcodes.Store.Select, {
                item: {
                    key: item.key,
                    name: item.name,
                    count,
                    price: Math.ceil(item.price / 2),
                    index
                }
            })
        );
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
     * Created to prevent repeated code in `purchase,` `sell,` and `select`.
     * Checks if the player has the current store open (prevent cheating),
     * and if the store exists in our list of stores.
     * @param player Player we are checking for.
     * @param storeKey The key of the store we are checking.
     * @returns True if the store passes the checks.
     */

    private verifyStore(player: Player, storeKey: string): boolean {
        if (player.storeOpen !== storeKey) {
            log.warning(`[${player.username}] Tried to act on a store that isn't open.`);
            return false;
        }

        let store = this.stores[storeKey];

        // Check if store exists.
        if (!store) {
            log.warning(
                `Player ${player.username} tried to refresh a non-existent store with ID: ${storeKey}.`
            );

            return false;
        }

        return true;
    }

    /**
     * Each store may have a different price for an item. This function
     * is incomplete since an item may have a default price which we
     * could utilize instead. That will not be added until later.
     * @param storeKey The key of the store we are checking.
     * @param itemKey The key of the item we are grabbing the price of.
     * @returns The price of the item otherwise defaults to value of 1.
     */

    public getPrice(storeKey: string, itemKey: string): number {
        let store = this.stores[storeKey];

        // This should absolutely not happen.
        if (!store) return -1;

        let item = _.find(store.items, { key: itemKey });

        if (!item) return 1;

        return item.price;
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
     * @returns A current Item object with the store's currency and amount provided.
     */

    public getCurrency(key: string, count: number): Item {
        return new Item(key, -1, -1, false, count);
    }

    /**
     * Checks if the item is original stock of the store by comparing the
     * item's key against the store's JSON data. This is used to remove
     * items when they're fully bought out if they're not part of the original stock.
     * @param storeKey The store we are checking the item for.
     * @param itemKey The item we are checking if it's in the original stock.
     * @returns Whether an item is part of the original JSON data or not.
     */

    public isOriginalItem(storeKey: string, itemKey: string): boolean {
        let store = (storeData as RawStore)[storeKey];

        if (!store) return false;

        // Return if the itemKey exists in the store's original stock.
        return !_.some(store.items, { key: itemKey });
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
