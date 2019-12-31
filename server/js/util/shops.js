/* global module */

let Shops = {},
    _ = require('underscore');

Shops.Data = {};
Shops.Ids = {};

Shops.isShopNPC = (npcId) => {
    return npcId in Shops.Ids;
};

Shops.getItems = (npcId) => {
    return Shops.Ids[npcId].items;
};

Shops.shopIdToNPC = (shopId) => {
    return Shops.Data[shopId].npcId;
};

Shops.getItemCount = (id) => {
    return Shops.getItems(id).length;
};

Shops.increment = (npcId, itemId, count) => {
    let shop = Shops.Ids[npcId],
        index = shop.items.indexOf(itemId);

    if (index < 0)
        return;

    shop.count[index] += count;

};

Shops.decrement = (npcId, buyId, count) => {
    let shop = Shops.Ids[npcId];

    if (!buyId || buyId < 0)
        return;

    shop.count[buyId] -= count;

    if (shop.count[buyId] < 0)
        shop.count[buyId] = 0;
};

Shops.getCost = (npcId, buyId, count) => {
    /**
     * Reason for the shopId variable is because some shops
     * may have different prices for the same item. A way to
     * spice up the game.
     */

    let shop = Shops.Ids[npcId];

    if (!shop || buyId < 0)
        return 2;

    return shop.prices[buyId] * count;
};

Shops.getStock = (npcId, buyId) => {
    let shop = Shops.Ids[npcId];

    if (!shop || !buyId || buyId < 0)
        return null;

    return shop.count[buyId];
};

Shops.getOriginalStock = (shopId, buyId) => {
    let shop = Shops.Ids[shopId];

    if (!buyId || buyId < 0)
        return;

    return shop.originalCount[buyId];
};

Shops.getCount = (npcId) => {
    let count = Shops.Ids[npcId].count,
        counts = [];

    if (_.isArray(count))
        return count;

    for (let i = 0; i < Shops.getItemCount(npcId); i++)
        counts.push(count);

    return counts;
};

Shops.getItem = (npcId, buyId) => {
    if (!buyId || buyId < 0)
        return;

    return Shops.Ids[npcId].items[buyId];
};

module.exports = Shops;
