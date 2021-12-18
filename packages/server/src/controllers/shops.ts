import _ from 'lodash';

import { Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Messages from '../network/messages';
import Items from '../util/items';
import Shop from '../util/shops';

import type { ShopData } from '@kaetram/common/types/info';
import type Player from '../game/entity/character/player/player';
import type World from '../game/world';

export default class Shops {
    private interval = 60_000;
    private shopInterval: NodeJS.Timeout | null = null;

    public constructor(private world: World) {
        this.load();
    }

    private load(): void {
        this.shopInterval = setInterval(() => {
            _.each(Shop.Data, (info) => {
                for (let i = 0; i < info.count.length; i++)
                    if (info.count[i] < info.originalCount[i])
                        Shop.increment(info.id!, info.items[i], 1);
            });
        }, this.interval);
    }

    public open(player: Player, npcId: number): void {
        player.send(
            new Messages.Shop(Opcodes.Shop.Open, {
                instance: player.instance,
                npcId,
                shopData: this.getShopData(npcId)!
            })
        );
    }

    public buy(player: Player, npcId: number, buyId: number, count: number): void {
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

    public sell(player: Player, npcId: number, slotId: number): void {
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

    public remove(player: Player): void {
        let selectedItem = player.selectedShopItem;

        if (!selectedItem) return;

        player.send(
            new Messages.Shop(Opcodes.Shop.Remove, {
                id: selectedItem.id,
                index: selectedItem.index
            })
        );

        player.selectedShopItem = null;
    }

    public refresh(shop: number): void {
        this.world.push(Opcodes.Push.Broadcast, {
            message: new Messages.Shop(Opcodes.Shop.Refresh, this.getShopData(shop))
        });
    }

    public getCurrency(npcId: number): number | null {
        let shop = Shop.Ids[npcId];

        if (!shop) return null;

        return shop.currency;
    }

    public getSellPrice(npcId: number, itemId: number, count = 1): number {
        let shop = Shop.Ids[npcId];

        if (!shop) return 1;

        let buyId = shop.items.indexOf(itemId);

        if (buyId < 0) return 1;

        return Math.floor(Shop.getCost(npcId, buyId, count) / 2);
    }

    private getShopData(npcId: number): ShopData | undefined {
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
