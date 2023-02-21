import storeData from '../../data/stores.json';
import Item from '../game/entity/objects/item';
import { Store as StorePacket } from '../network/packets';

import { Modules, Opcodes } from '@kaetram/common/network';
import StoreEn from '@kaetram/common/text/en/store';
import log from '@kaetram/common/util/log';

import type {
    RawStore,
    SerializedStoreInfo,
    SerializedStoreItem,
    StoreData,
    StoreItem
} from '@kaetram/common/types/stores';
import type Player from '../game/entity/character/player/player';
import type NPC from '../game/entity/npc/npc';
import type World from '../game/world';

interface StoreInfo {
    items: Item[];
    refresh: number;
    currency: string;
    restricted?: boolean;
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

    private updateFrequency: number = Modules.Constants.STORE_UPDATE_FREQUENCY;

    public constructor(private world: World) {
        // Load stores from the JSON.
        for (let key in storeData) this.load(storeData[key as keyof typeof storeData], key);

        // Set up an interval for refreshing the store data.
        setInterval(this.update.bind(this), this.updateFrequency);

        let size = Object.keys(this.stores).length;

        log.info(`Loaded ${size} shop${size > 1 ? 's' : ''}.`);
    }

    /**
     * Loads a store by converting the JSON data into a `StoreInfo` object.
     * We create an instance of every object we are trying to load.
     * @param store Raw store data pulled from the JSON.
     * @param key The key of the store data.
     */

    private load(store: StoreData, key: string): void {
        let { refresh, currency, restricted } = store,
            items: Item[] = [];

        for (let item of store.items) {
            let { key, count, price, stockAmount } = item;

            // Skip if an item already exists with the same key.
            if (items.some(({ key: itemKey }) => itemKey === key)) {
                log.warning(`${StoreEn.WARNING_DUPLICATE}'${key}'.`);

                continue;
            }

            let storeItem = new Item(key, -1, -1, false, count);

            // Assign price if provided, otherwise use default item price.
            if (price) storeItem.price = price;

            // Stocking amount and max amount of the item in store.
            storeItem.stockAmount = stockAmount || 1;
            storeItem.maxCount = count;

            items.push(storeItem);
        }

        this.stores[key] = {
            items,
            refresh,
            currency,
            restricted,
            lastUpdate: Date.now()
        };
    }

    /**
     * Update function called at a `this.`updateFrequency` interval.
     */

    private update(): void {
        for (let key in this.stores) {
            let store = this.stores[key];

            if (!this.canRefresh(store)) continue;

            this.stockItems(store);
            this.updatePlayers(key);

            store.lastUpdate = Date.now();
        }
    }

    /**
     * Iterates through all the items in the store and increments
     * them by one.
     * @param store The store we are incrementing item counts of.
     */

    private stockItems(store: StoreInfo): void {
        for (let item of store.items) {
            if (item.count === -1 || item.count >= item.maxCount) continue;

            // If an alternate optional stock count is provided, increment by that amount.
            if (item.stockAmount) item.count += item.stockAmount;
        }
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

        if (!store) return log.debug(`[${player.username}] ${StoreEn.INVALID_STORE}.`);

        player.send(new StorePacket(Opcodes.Store.Open, this.serialize(npc.store)));

        player.storeOpen = npc.store;
    }

    /**
     * Handles the purchasing of an item from the store. If successful,
     * decrements the item count in the store by the count specified, and
     * sends the data to all the players accessing the store.
     * @param player The player that is purchasing the item.
     * @param storeKey The key of the store the item is being purchased from.
     * @param index The index of the item we are purchasing.
     * @param count The amount of the item being purchased.
     */

    public purchase(player: Player, storeKey: string, index: number, count = 1): void {
        if (!this.verifyStore(player, storeKey)) return;

        let store = this.stores[storeKey],
            item = store.items[index];

        // Prevent cheaters from buying any of the items.
        if (player.isCheater()) return player.notify(StoreEn.CHEATER);

        // First and foremost check the user has enough space.
        if (!player.inventory.hasSpace() && !player.inventory.hasItem(item.key))
            return player.notify(StoreEn.NOT_ENOUGH_SPACE);

        // Check if item exists
        if (!item)
            return log.error(`${player.username} ${StoreEn.PURCHASE_INVALID_STORE}${storeKey}.`);

        if (item.count !== -1) {
            if (item.count < 1) return player.notify(StoreEn.ITEM_OUT_OF_STOCK);

            // Prevent buying more than store has stock. Default to max stock.
            count = item.count < count ? item.count : count;
        }

        // Find total price of item by multiplying count against price.
        let currency = player.inventory.getIndex(store.currency, item.price * count);

        // If no inventory slot index with currency is found, stop the purchase.
        if (currency < 0) return player.notify(StoreEn.NOT_ENOUGH_CURRENCY);

        // Clone the item we are adding
        let itemToAdd = item.copy();

        itemToAdd.count = count;

        // Add the item to the player's inventory.
        let amount = player.inventory.add(itemToAdd);

        if (amount < 1) return;

        if (item.count > 0) {
            // Decrement the item count by the amount we are buying.
            item.count -= amount;

            // Remove item from store if it is out of stock and not original to the store.
            if (item.count < 1 && this.isOriginalItem(storeKey, item.key))
                store.items = store.items.filter((storeItem) => {
                    return storeItem.key !== item.key;
                });
        }

        player.inventory.remove(currency, item.price * amount);

        log.stores(
            `Player ${player.username} pruchased ${amount} ${item.key} for ${item.price * amount} ${
                store.currency
            }.`
        );
        // Sync up new store data to all players.
        this.updatePlayers(storeKey);
    }

    /**
     * Sells an item to the store. Certain stores are allowed to accept
     * items they do not originally have in stock. In that case we add
     * the specific item to the stock.
     * @param player The player that is selling the item.
     * @param key The key of the store we are currently in.
     * @param index The index of the item in the player's inventory.
     * @param count The amount of the item being sold.
     */

    public sell(player: Player, key: string, index: number, count = 1): void {
        if (!this.verifyStore(player, key)) return;

        // Ensure the count is correct.
        if (count < 1) return player.notify(StoreEn.INVALID_ITEM_COUNT);

        let slot = player.inventory.get(index);

        // Ensure the item in the slot exists.
        if (slot.isEmpty())
            return log.warning(`[${player.username}] ${StoreEn.INVALID_ITEM_SELECTION}`);

        let store = this.stores[key];

        // Disable selling in restricted stores.
        if (store.restricted) return player.notify(StoreEn.RESTRICTED_STORE);

        /**
         * Although a lot of these checks are similar to `select()` they are necessary
         * here just in case someone is messing with the client; which, in an open-source
         * project, is to be expected and frankly, quite reasonable.
         */

        if (slot.key === store.currency) return player.notify(StoreEn.CANNOT_SELL_ITEM);

        // Temporary fix until we have a more suitable UI.
        ({ count } = slot);

        // Find the item in the store if it exists.
        let item = player.inventory.getItem(slot),
            storeItem = store.items.find((item) => item.key === slot.key),
            price = Math.ceil((storeItem ? storeItem.price : item.price) / 2) * count; // Use store price or item default.

        // Items without prices (quest items) cannot be sold.
        if (price < 0) return player.notify(StoreEn.CANNOT_SELL_ITEM);

        player.inventory.remove(index, count);

        // Very weird if this somehow happened at this point in the code, I'd be curious to see how.
        if (player.inventory.add(this.getCurrency(store.currency, price)) < 1)
            return player.notify(StoreEn.NOT_ENOUGH_CURRENCY);

        // Increment the item count or add to store only if the player isn't a cheater :)
        if (!player.isCheater())
            if (!storeItem?.count) store.items.push(item);
            else if (storeItem?.count !== -1) storeItem.count += count;

        // Sync up new store data to all players.
        this.updatePlayers(key);
    }

    /**
     * When selecting an item in the inventory, we just check the price of the item
     * in the player's inventory and return the result back. If the item is in the store
     * then we refer to that price instead.
     * @param player The player we are selecting an item for sale of.
     * @param key The store that the action takes place in.
     * @param index The selected inventory slot index from the client (used for verification).
     * @param count Optional parameter for how much of an item to select (to be implemented client side).
     */

    public select(player: Player, key: string, index: number, count = 1): void {
        if (!this.verifyStore(player, key) || isNaN(index)) return;

        // Grab the inventory slot at the specified index.
        let slot = player.inventory.get(index);

        // This shouldn't get called unless there is a bug or client was messed with.
        if (slot.isEmpty())
            return log.warning(`[${player.username}] ${StoreEn.INVALID_ITEM_SELECTION}`);

        let store = this.stores[key];

        // Check that the player isn't trying to sell the currency to the store.
        if (slot.key === store.currency) return player.notify(StoreEn.CANNOT_SELL_ITEM);

        // Temporary fix until we have a more suitable UI.
        ({ count } = slot);

        // Create an instance of an item and try to check if that item exists in the store.
        let item = player.inventory.getItem(slot),
            storeItem = store.items.find((item) => item.key === slot.key),
            price = Math.ceil((storeItem ? storeItem.price : item.price) / 2) * count; // Use store price or item default.

        // Items without prices (quest items) cannot be sold.
        if (price < 1) return player.notify(StoreEn.CANNOT_SELL_ITEM);

        // Invalid price, this shouldn't happen.
        if (isNaN(price)) return log.error(`Malformed pricing for item selection.`);

        log.stores(
            `Player ${player.username} sold ${count} ${item.key} for ${item.price * count} ${
                store.currency
            }.`
        );

        // Create the select packet for the client to process and move the item into the slot.
        player.send(
            new StorePacket(Opcodes.Store.Select, {
                key,
                item: {
                    key: item.key,
                    name: item.name,
                    count,
                    price,
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
            log.warning(`[${player.username}] ${StoreEn.ACTION_STORE_NOT_OPEN}`);
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

        let item = store.items.find((item) => item.key === itemKey);

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
        return !store.items.some((item) => item.key === itemKey);
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
        for (let item of store.items)
            items.push({
                key: item.key,
                name: item.name,
                count: item.count,
                price: item.price
            });

        return {
            key,
            items,
            currency: store.currency
        };
    }
}
