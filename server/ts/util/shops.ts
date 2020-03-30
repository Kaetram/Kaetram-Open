/* eslint-disable consistent-return */
import * as _ from 'underscore';

export default {
    Data: {},
    Ids: {},

    isShopNPC(npcId) {
        return npcId in this.Ids;
    },

    getItems(npcId) {
        return this.Ids[npcId].items;
    },

    shopIdToNPC(shopId) {
        return this.Data[shopId].npcId;
    },

    getItemCount(id) {
        return this.getItems(id).length;
    },

    increment(npcId, itemId, count) {
        const shop = this.Ids[npcId];
        const index = shop.items.indexOf(itemId);

        if (index < 0) return;

        shop.count[index] += count;
    },

    decrement(npcId, buyId, count) {
        const shop = this.Ids[npcId];

        if (!buyId || buyId < 0) return;

        shop.count[buyId] -= count;

        if (shop.count[buyId] < 0) shop.count[buyId] = 0;
    },

    getCost(npcId, buyId, count) {
        /**
         * Reason for the shopId variable is because some shops
         * may have different prices for the same item. A way to
         * spice up the game.
         */

        const shop = this.Ids[npcId];

        if (!shop || buyId < 0) return 2;

        return shop.prices[buyId] * count;
    },

    getStock(npcId, buyId) {
        const shop = this.Ids[npcId];

        if (!shop || !buyId || buyId < 0) return null;

        return shop.count[buyId];
    },

    getOriginalStock(shopId, buyId) {
        const shop = this.Ids[shopId];

        if (!buyId || buyId < 0) return;

        return shop.originalCount[buyId];
    },

    getCount(npcId) {
        const { count } = this.Ids[npcId];
        const counts = [];

        if (_.isArray(count)) return count;

        for (let i = 0; i < this.getItemCount(npcId); i++) counts.push(count);

        return counts;
    },

    getItem(npcId, buyId) {
        if (!buyId || buyId < 0) return;

        return this.Ids[npcId].items[buyId];
    }
};
