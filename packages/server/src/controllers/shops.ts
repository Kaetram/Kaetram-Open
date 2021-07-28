import _ from 'lodash';

import Packets from '@kaetram/common/src/packets';

import Player from '../game/entity/character/player/player';
import World from '../game/world';
import Messages from '../network/messages';
import Items from '../util/items';
import log from '../util/log';
import Shop from '../util/shops';

export interface ShopData {
    id: number;
    strings: string[];
    names: string[];
    counts: number[];
    prices: number[];
}

export default class Shops {
    world: World;

    interval: number;
    shopInterval: NodeJS.Timeout | null;

    constructor(world: World) {
        this.world = world;

        this.interval = 60000;
        this.shopInterval = null;

        this.load();
    }

    load(): void {
        this.shopInterval = setInterval(() => {
            _.each(Shop.Data, (info) => {
                for (let i = 0; i < info.count.length; i++)
                    if (info.count[i] < info.originalCount[i])
                        Shop.increment(info.id!, info.items[i], 1);
            });
        }, this.interval);
    }

    open(player: Player, npcId: number): void {
        player.send(
            new Messages.Shop(Packets.ShopOpcode.Open, {
                instance: player.instance,
                npcId,
                shopData: this.getShopData(npcId)
            })
        );
    }

    buy(player: Player, npcId: number, buyId: number, count: number): void {
        let cost = Shop.getCost(npcId, buyId, count),
            currency = this.getCurrency(npcId),
            stock = Shop.getStock(npcId, buyId);

        if (!cost || !currency || !stock) {
            log.info('Invalid shop data.');
            return;
        }

        // TODO: Make it so that when you have the exact coin count, it removes coins and replaces it with the item purchased.

        if (stock === 0) {
            player.notify('This item is currently out of stock.');
            return;
        }

        if (!player.inventory.contains(currency, cost)) {
            player.notify('You do not have enough money to purchase this.');
            return;
        }

        if (!player.inventory.hasSpace()) {
            player.notify('You do not have enough space in your inventory.');
            return;
        }

        if (count > stock) count = stock;

        player.inventory.remove(currency, cost);
        player.inventory.add({
            id: Shop.getItem(npcId, buyId),
            count,
            ability: -1,
            abilityLevel: -1
        });

        Shop.decrement(npcId, buyId, count);

        this.refresh(npcId);
    }

    sell(player: Player, npcId: number, slotId: number): void {
        let item = player.inventory.slots[slotId],
            shop = Shop.Ids[npcId];

        if (!shop || !item) {
            log.info('Invalid shop data.');
            return;
        }

        if (!shop.items.includes(item.id)) {
            player.notify('That item cannot be sold in this store.');
            return;
        }

        let currency = this.getCurrency(npcId)!,
            price = this.getSellPrice(npcId, item.id, item.count);

        Shop.increment(npcId, item.id, item.count);

        player.inventory.remove(item.id, item.count, item.index);
        player.inventory.add({
            id: currency,
            count: price
        });

        this.remove(player);
        this.refresh(npcId);
    }

    remove(player: Player): void {
        let selectedItem = player.selectedShopItem;

        if (!selectedItem) return;

        player.send(
            new Messages.Shop(Packets.ShopOpcode.Remove, {
                id: selectedItem.id,
                index: selectedItem.index
            })
        );

        player.selectedShopItem = null;
    }

    refresh(shop: number): void {
        this.world.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Shop(Packets.ShopOpcode.Refresh, this.getShopData(shop))
        });
    }

    getCurrency(npcId: number): number | null {
        let shop = Shop.Ids[npcId];

        if (!shop) return null;

        return shop.currency;
    }

    getSellPrice(npcId: number, itemId: number, count = 1): number {
        let shop = Shop.Ids[npcId];

        if (!shop) return 1;

        let buyId = shop.items.indexOf(itemId);

        if (buyId < 0) return 1;

        return Math.floor(Shop.getCost(npcId, buyId, count) / 2);
    }

    getShopData(npcId: number): ShopData | undefined {
        let shop = Shop.Ids[npcId];

        if (!shop || !_.isArray(shop.items)) return;

        let strings = [],
            names = [];

        for (let i = 0; i < shop.items.length; i++) {
            strings.push(Items.idToString(shop.items[i]));
            names.push(Items.idToName(shop.items[i]));
        }

        return {
            id: npcId,
            strings,
            names,
            counts: shop.count,
            prices: shop.prices
        };
    }
}
