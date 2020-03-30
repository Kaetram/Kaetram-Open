"use strict";
exports.__esModule = true;
var _ = require("underscore");
var shops_1 = require("../util/shops");
var items_1 = require("../util/items");
var messages_1 = require("../network/messages");
var packets_1 = require("../network/packets");
/**
 *
 */
var Shops = /** @class */ (function () {
    function Shops(world) {
        this.world = world;
        this.interval = 60000;
        this.shopInterval = null;
        this.load();
    }
    Shops.prototype.load = function () {
        this.shopInterval = setInterval(function () {
            _.each(shops_1["default"].Data, function (info) {
                for (var i = 0; i < info.count; i++)
                    if (info.count[i] < info.originalCount[i])
                        shops_1["default"].increment(info.id, info.items[i], 1);
            });
        }, this.interval);
    };
    Shops.prototype.open = function (player, npcId) {
        player.send(new messages_1["default"].Shop(packets_1["default"].ShopOpcode.Open, {
            instance: player.instance,
            npcId: npcId,
            shopData: this.getShopData(npcId)
        }));
    };
    Shops.prototype.buy = function (player, npcId, buyId, count) {
        var cost = shops_1["default"].getCost(npcId, buyId, count);
        var currency = this.getCurrency(npcId);
        var stock = shops_1["default"].getStock(npcId, buyId);
        if (!cost || !currency || !stock) {
            console.info('Invalid shop data.');
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
        if (count > stock)
            count = stock;
        player.inventory.remove(currency, cost);
        player.inventory.add({
            id: shops_1["default"].getItem(npcId, buyId),
            count: count,
            ability: -1,
            abilityLevel: -1
        });
        shops_1["default"].decrement(npcId, buyId, count);
        this.refresh(npcId);
    };
    Shops.prototype.sell = function (player, npcId, slotId) {
        var item = player.inventory.slots[slotId];
        var shop = shops_1["default"].Ids[npcId];
        if (!shop || !item) {
            console.info('Invalid shop data.');
            return;
        }
        if (shop.items.indexOf(item.id) < 0) {
            player.notify('That item cannot be sold in this store.');
            return;
        }
        var currency = this.getCurrency(npcId);
        var price = this.getSellPrice(npcId, item.id, item.count);
        shops_1["default"].increment(npcId, item.id, item.count);
        player.inventory.remove(item.id, item.count, item.index);
        player.inventory.add({
            id: currency,
            count: price
        });
        this.remove(player);
        this.refresh(npcId);
    };
    Shops.prototype.remove = function (player) {
        var selectedItem = player.selectedShopItem;
        if (!selectedItem)
            return;
        player.send(new messages_1["default"].Shop(packets_1["default"].ShopOpcode.Remove, {
            id: selectedItem.id,
            index: selectedItem.index
        }));
        player.selectedShopItem = null;
    };
    Shops.prototype.refresh = function (shop) {
        this.world.push(packets_1["default"].PushOpcode.Broadcast, {
            message: new messages_1["default"].Shop(packets_1["default"].ShopOpcode.Refresh, this.getShopData(shop))
        });
    };
    Shops.prototype.getCurrency = function (npcId) {
        var shop = shops_1["default"].Ids[npcId];
        if (!shop)
            return null;
        return shop.currency;
    };
    Shops.prototype.getSellPrice = function (npcId, itemId, count) {
        if (count === void 0) { count = 1; }
        var shop = shops_1["default"].Ids[npcId];
        if (!shop)
            return 1;
        var buyId = shop.items.indexOf(itemId);
        if (buyId < 0)
            return 1;
        return Math.floor(shops_1["default"].getCost(npcId, buyId, count) / 2);
    };
    Shops.prototype.getShopData = function (npcId) {
        var shop = shops_1["default"].Ids[npcId];
        if (!shop || !_.isArray(shop.items))
            return;
        var strings = [];
        var names = [];
        for (var i = 0; i < shop.items.length; i++) {
            strings.push(items_1["default"].idToString(shop.items[i]));
            names.push(items_1["default"].idToName(shop.items[i]));
        }
        return {
            id: npcId,
            strings: strings,
            names: names,
            counts: shop.count,
            prices: shop.prices
        };
    };
    return Shops;
}());
exports["default"] = Shops;
