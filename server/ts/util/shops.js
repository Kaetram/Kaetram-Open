"use strict";
exports.__esModule = true;
/* eslint-disable consistent-return */
var _ = require("underscore");
exports["default"] = {
    Data: {},
    Ids: {},
    isShopNPC: function (npcId) {
        return npcId in this.Ids;
    },
    getItems: function (npcId) {
        return this.Ids[npcId].items;
    },
    shopIdToNPC: function (shopId) {
        return this.Data[shopId].npcId;
    },
    getItemCount: function (id) {
        return this.getItems(id).length;
    },
    increment: function (npcId, itemId, count) {
        var shop = this.Ids[npcId];
        var index = shop.items.indexOf(itemId);
        if (index < 0)
            return;
        shop.count[index] += count;
    },
    decrement: function (npcId, buyId, count) {
        var shop = this.Ids[npcId];
        if (!buyId || buyId < 0)
            return;
        shop.count[buyId] -= count;
        if (shop.count[buyId] < 0)
            shop.count[buyId] = 0;
    },
    getCost: function (npcId, buyId, count) {
        /**
         * Reason for the shopId variable is because some shops
         * may have different prices for the same item. A way to
         * spice up the game.
         */
        var shop = this.Ids[npcId];
        if (!shop || buyId < 0)
            return 2;
        return shop.prices[buyId] * count;
    },
    getStock: function (npcId, buyId) {
        var shop = this.Ids[npcId];
        if (!shop || !buyId || buyId < 0)
            return null;
        return shop.count[buyId];
    },
    getOriginalStock: function (shopId, buyId) {
        var shop = this.Ids[shopId];
        if (!buyId || buyId < 0)
            return;
        return shop.originalCount[buyId];
    },
    getCount: function (npcId) {
        var count = this.Ids[npcId].count;
        var counts = [];
        if (_.isArray(count))
            return count;
        for (var i = 0; i < this.getItemCount(npcId); i++)
            counts.push(count);
        return counts;
    },
    getItem: function (npcId, buyId) {
        if (!buyId || buyId < 0)
            return;
        return this.Ids[npcId].items[buyId];
    }
};
