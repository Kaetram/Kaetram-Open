/* global module */

let _ = require('underscore'),
    ShopData = require('../util/shops'),
    Items = require('../util/items'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets');

class Shops {

    constructor(world) {
        this.world = world;

        this.interval = 60000;
        this.shopInterval = null;

        this.load();
    }

    load() {

        this.shopInterval = setInterval(() => {

            _.each(ShopData.Data, (info) => {

                for (let i = 0; i < info.count; i++)
                    if (info.count[i] < info.originalCount[i])
                        ShopData.increment(info.id, info.items[i], 1);

            });

        }, this.interval);
    }

    open(player, npcId) {

        player.send(new Messages.Shop(Packets.ShopOpcode.Open, {
            instance: player.instance,
            npcId: npcId,
            shopData: this.getShopData(npcId)
        }));
    }

    buy(player, npcId, buyId, count) {
        let cost = ShopData.getCost(npcId, buyId, count),
            currency = this.getCurrency(npcId),
            stock = ShopData.getStock(npcId, buyId);

        if (!cost || !currency || !stock) {
            log.info('Invalid shop data.');
            return;
        }

        //TODO: Make it so that when you have the exact coin count, it removes coins and replaces it with the item purchased.

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

        if (count > stock)
            count = stock;

        player.inventory.remove(currency, cost);
        player.inventory.add({
            id: ShopData.getItem(npcId, buyId),
            count: count,
            ability: -1,
            abilityLevel: -1
        });

        ShopData.decrement(npcId, buyId, count);

        this.refresh(npcId);
    }

    sell(player, npcId, slotId) {
        let item = player.inventory.slots[slotId],
            shop = ShopData.Ids[npcId];

        if (!shop || !item) {
            log.info('Invalid shop data.');
            return;
        }

        if (shop.items.indexOf(item.id) < 0) {
            player.notify('That item cannot be sold in this store.');
            return;
        }

        let currency = this.getCurrency(npcId),
            price = this.getSellPrice(npcId, item.id, item.count);

        ShopData.increment(npcId, item.id, item.count);

        player.inventory.remove(item.id, item.count, item.index);
        player.inventory.add({
            id: currency,
            count: price
        });

        this.remove(player);
        this.refresh(npcId);

    }

    remove(player) {
        let selectedItem = player.selectedShopItem;

        if (!selectedItem)
            return;

        player.send(new Messages.Shop(Packets.ShopOpcode.Remove, {
            id: selectedItem.id,
            index: selectedItem.index
        }));

        player.selectedShopItem = null;
    }

    refresh(shop) {
        this.world.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Shop(Packets.ShopOpcode.Refresh, this.getShopData(shop))
        });
    }

    getCurrency(npcId) {
        let shop = ShopData.Ids[npcId];

        if (!shop)
            return null;

        return shop.currency;
    }

    getSellPrice(npcId, itemId, count = 1) {
        let shop = ShopData.Ids[npcId];

        if (!shop)
            return 1;

        let buyId = shop.items.indexOf(itemId);

        if (buyId < 0)
            return 1;

        return Math.floor(ShopData.getCost(npcId, buyId, count) / 2);
    }

    getShopData(npcId) {
        let shop = ShopData.Ids[npcId];

        if (!shop || !_.isArray(shop.items))
            return;

        let strings = [], names = [];

        for (let i = 0; i < shop.items.length; i++) {
            strings.push(Items.idToString(shop.items[i]));
            names.push(Items.idToName(shop.items[i]));
        }

        return {
            id: npcId,
            strings: strings,
            names: names,
            counts: shop.count,
            prices: shop.prices
        }
    }

}

export default Shops;
