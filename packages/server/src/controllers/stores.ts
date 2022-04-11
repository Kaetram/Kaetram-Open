import _ from 'lodash';

import World from '../game/world';

import shopData from '../../data/stores.json';

import log from '@kaetram/common/util/log';

import type { Store, StoreInfo } from '@kaetram/common/types/stores';
import Player from '../game/entity/character/player/player';
import Item from '../game/entity/objects/item';
import NPC from '../game/entity/npc/npc';

/**
 * Shops are globally controlled and updated
 * by the world. When a player purchases an item,
 * we relay that information to the rest of the players.
 */

export default class Stores {
    private stores: Store = {}; // Key is the NPC that the store belongs to.

    private updateFrequency = 20_000; // Update every 20 seconds

    public constructor(private world: World) {
        // Load stores from the JSON.
        _.each(shopData, (store: StoreInfo, key: string) => (this.stores[key] = store));

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
        _.each(this.stores, (store) => {
            if (!this.canRefresh(store)) return;

            this.stockItems(store);

            store.lastUpdate = Date.now();
        });
    }

    /**
     * Iterates through all the items in the store and increments
     * them by one.
     * @param store The store we are incrementing item counts of.
     */

    private stockItems(store: StoreInfo): void {
        _.each(store.items, (item) => {
            // If an alternate optional stock count is provided, increment by that amount.
            item.count += item.stockCount ? item.stockCount : 1;
        });
    }

    public open(player: Player, store: StoreInfo): void {
        player.notify('opening store yo');
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
        if (npc.store === '' || !(npc.store in this.stores)) return undefined;

        return this.stores[npc.store];
    }

    /**
     * Serializes data about a store.
     * @param id The store we are serializing.
     * @returns Data in the form of a `StoreInfo` object.
     */

    public serialize(id: number): StoreInfo {
        return this.stores[id];
    }

    // private interval = 60_000;
    // private shopInterval: NodeJS.Timeout | null = null;
    // public constructor(private world: World) {
    //     this.load();
    // }
    // private load(): void {
    //     this.shopInterval = setInterval(() => {
    //         _.each(Shop.Data, (info) => {
    //             for (let i = 0; i < info.count.length; i++)
    //                 if (info.count[i] < info.originalCount[i])
    //                     Shop.increment(info.id!, info.items[i], 1);
    //         });
    //     }, this.interval);
    // }
    // public open(player: Player, npcId: number): void {
    //     player.send(
    //         new ShopPacket(Opcodes.Shop.Open, {
    //             instance: player.instance,
    //             npcId,
    //             shopData: this.getShopData(npcId)!
    //         })
    //     );
    // }
    // public buy(player: Player, npcId: number, buyId: number, count: number): void {
    //     let cost = Shop.getCost(npcId, buyId, count),
    //         currency = this.getCurrency(npcId),
    //         stock = Shop.getStock(npcId, buyId);
    //     if (!cost || !currency || !stock) {
    //         log.info('Invalid shop data.');
    //         return;
    //     }
    //     // TODO: Make it so that when you have the exact coin count, it removes coins and replaces it with the item purchased.
    //     if (stock === 0) {
    //         player.notify('This item is currently out of stock.');
    //         return;
    //     }
    //     if (!player.inventory.contains(currency, cost)) {
    //         player.notify('You do not have enough money to purchase this.');
    //         return;
    //     }
    //     if (!player.inventory.hasSpace()) {
    //         player.notify('You do not have enough space in your inventory.');
    //         return;
    //     }
    //     if (count > stock) count = stock;
    //     player.inventory.remove(currency, cost);
    //     player.inventory.add({
    //         id: Shop.getItem(npcId, buyId),
    //         count,
    //         ability: -1,
    //         abilityLevel: -1
    //     });
    //     Shop.decrement(npcId, buyId, count);
    //     this.refresh(npcId);
    // }
    // public sell(player: Player, npcId: number, slotId: number): void {
    //     let item = player.inventory.slots[slotId],
    //         shop = Shop.Ids[npcId];
    //     if (!shop || !item) {
    //         log.info('Invalid shop data.');
    //         return;
    //     }
    //     if (!shop.items.includes(item.id)) {
    //         player.notify('That item cannot be sold in this store.');
    //         return;
    //     }
    //     let currency = this.getCurrency(npcId)!,
    //         price = this.getSellPrice(npcId, item.id, item.count);
    //     Shop.increment(npcId, item.id, item.count);
    //     player.inventory.remove(item.id, item.count, item.index);
    //     player.inventory.add({
    //         id: currency,
    //         count: price
    //     });
    //     this.remove(player);
    //     this.refresh(npcId);
    // }
    // public remove(player: Player): void {
    //     let selectedItem = player.selectedShopItem;
    //     if (!selectedItem) return;
    //     player.send(
    //         new ShopPacket(Opcodes.Shop.Remove, {
    //             id: selectedItem.id,
    //             index: selectedItem.index
    //         })
    //     );
    //     player.selectedShopItem = null;
    // }
    // public refresh(shop: number): void {
    //     this.world.push(Modules.PacketType.Broadcast, {
    //         packet: new ShopPacket(Opcodes.Shop.Refresh, this.getShopData(shop))
    //     });
    // }
    // public getCurrency(npcId: number): number | null {
    //     let shop = Shop.Ids[npcId];
    //     if (!shop) return null;
    //     return shop.currency;
    // }
    // public getSellPrice(npcId: number, itemId: number, count = 1): number {
    //     let shop = Shop.Ids[npcId];
    //     if (!shop) return 1;
    //     let buyId = shop.items.indexOf(itemId);
    //     if (buyId < 0) return 1;
    //     return Math.floor(Shop.getCost(npcId, buyId, count) / 2);
    // }
    // private getShopData(npcId: number): void {
    //     // let shop = Shop.Ids[npcId];
    //     // if (!shop || !_.isArray(shop.items)) return;
    //     // let strings = [],
    //     //     names = [];
    //     // for (let i = 0; i < shop.items.length; i++) {
    //     //     strings.push(Items.idToString(shop.items[i]));
    //     //     names.push(Items.idToName(shop.items[i]));
    //     // }
    //     // return {
    //     //     id: npcId,
    //     //     strings,
    //     //     names,
    //     //     counts: shop.count,
    //     //     prices: shop.prices
    //     // };
    // }
}
