/* global module */

let _ = require('underscore'),
    ShopData = require('../util/shops'),
    Items = require('../util/items'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets');

class Shops {

    constructor(world) {
        let self = this;

        self.world = world;

        self.interval = 60000;
        self.shopInterval = null;

        self.load();
    }

    load() {
        let self = this;

        self.shopInterval = setInterval(() => {

            _.each(ShopData.Data, (info) => {

                for (let i = 0; i < info.count; i++)
                    if (info.count[i] < info.originalCount[i])
                        ShopData.increment(info.id, info.items[i], 1);

            });

        }, self.interval);
    }

    open(player, shopId) {
        let self = this;

        player.send(new Messages.Shop(Packets.ShopOpcode.Open, {
            instance: player.instance,
            npcId: shopId,
            shopData: self.getShopData(shopId)
        }));

    }

    buy(player, shopId, itemId, count) {
        let self = this,
            cost = ShopData.getCost(shopId, itemId, count),
            currency = self.getCurrency(shopId),
            stock = ShopData.getStock(shopId, itemId);

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
        player.inventory.add(itemId, count);

        ShopData.decrement(shopId, itemId, count);

        self.refresh();
    }

    refresh(shopId) {
        let self = this;

        self.world.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Shop(Packets.ShopOpcode.Refresh, self.getShopData(shopId))
        });
    }

    getCurrency(id) {
        return ShopData.Ids[id].currency;
    }

    getShopData(id) {
        let self = this;

        if (!ShopData.isShopNPC(id))
            return;

        let items = ShopData.getItems(id),
            strings = [],
            names = [];

        for (let i = 0; i < items.length; i++) {
            strings.push(Items.idToString(items[i]));
            names.push(Items.idToName(items[i]));
        }

        return {
            id: id,
            strings: strings,
            names: names,
            counts: ShopData.getCount(id)
        }
    }

}

module.exports = Shops;
