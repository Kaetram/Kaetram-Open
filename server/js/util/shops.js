/* global module */

let Shops = {},
    _ = require('underscore');

Shops.Data = {};
Shops.Ids = {};

Shops.isShopNPC = function(npcId) {
    return npcId in Shops.Ids;
};

Shops.getItems = function(id) {
    return Shops.Ids[id].items;
};

Shops.getItemCount = function(id) {
    return Shops.getItems(id).length;
};

Shops.increment = function(shopId, itemId, count) {
    let shop = Shops.Ids[shopId],
        index = shop.items.indexOf(itemId);

    if (index < 0)
        return;

    let shopData = Shops.Data[shop.key];

    shopData.count[index] += count;

};

Shops.decrement = function(shopId, itemId, count) {
    let shop = Shops.Ids[shopId],
        index = shop.items.indexOf(itemId);

    if (index < 0)
        return;

    /**
     * Before y'all start complaining about why I didn't simplify this,
     * remember.... Pointersssssssss
     */

    let shopData = Shops.Data[shop.key];

    shopData.count[index] -= count;

    if (shopData.count[index] < 0)
        shopData.count[index] = 0;
};

Shops.getCost = function(shopId, itemId, count) {
    /**
     * Reason for the shopId variable is because some shops
     * may have different prices for the same item. A way to
     * spice up the game.
     */

    let shop = Shops.Ids[shopId],
        index = shop.items.indexOf(itemId);

    if (index < 0)
        return;

    return shop.prices[index] * count;
};

Shops.getStock = function(shopId, itemId) {

    let shop = Shops.Ids[shopId],
        index = shop.items.indexOf(itemId);

    if (index < 0)
        return;

    return shop.count[index];
};

Shops.getOriginalStock = function(shopId, itemId) {

    let shop = Shops.Ids[shopId],
        index = shop.index.indexOf(itemId);

    if (index < 0)
        return;

    return shop.originalCount[index];
};

Shops.getCount = function(id) {
    let count = Shops.Ids[id].count,
        counts = [];

    if (_.isArray(count))
        return count;

    for (let i = 0; i < Shops.getItemCount(id); i++)
        counts.push(count);

    return counts;
};

module.exports = Shops;