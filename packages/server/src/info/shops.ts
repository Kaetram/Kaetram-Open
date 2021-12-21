import _ from 'lodash';

interface ShopData {
    id?: number;
    key: string;
    npcId: number;
    currency: number;
    prices: number[];
    items: number[];
    count: number[];
    originalCount: number[];
    stockDuration: number;
}

export default {
    Data: {} as { [id: string]: ShopData },
    Ids: {} as { [id: number]: ShopData },

    isShopNPC(npcId: number): boolean {
        return npcId in this.Ids;
    },

    getItems(npcId: number): number[] {
        return this.Ids[npcId].items;
    },

    shopIdToNPC(shopId: string): number {
        return this.Data[shopId].npcId;
    },

    getItemCount(id: number): number {
        return this.getItems(id).length;
    },

    increment(npcId: number, itemId: number, count: number): void {
        let shop = this.Ids[npcId],
            index = shop.items.indexOf(itemId);

        if (index < 0) return;

        shop.count[index] += count;
    },

    decrement(npcId: number, buyId: number, count: number): void {
        let shop = this.Ids[npcId];

        if (!buyId || buyId < 0) return;

        shop.count[buyId] -= count;

        if (shop.count[buyId] < 0) shop.count[buyId] = 0;
    },

    getCost(npcId: number, buyId: number, count: number): number {
        /**
         * Reason for the shopId variable is because some shops
         * may have different prices for the same item. A way to
         * spice up the game.
         */

        let shop = this.Ids[npcId];

        if (!shop || buyId < 0) return 2;

        return shop.prices[buyId] * count;
    },

    getStock(npcId: number, buyId: number): number | null {
        let shop = this.Ids[npcId];

        if (!shop || !buyId || buyId < 0) return null;

        return shop.count[buyId];
    },

    getOriginalStock(shopId: number, buyId: number): number | undefined {
        let shop = this.Ids[shopId];

        if (!buyId || buyId < 0) return;

        return shop.originalCount[buyId];
    },

    getCount(npcId: number): number[] {
        let { count } = this.Ids[npcId],
            counts: number[] = [];

        if (_.isArray(count)) return count;

        for (let i = 0; i < this.getItemCount(npcId); i++) counts.push(count);

        return counts;
    },

    getItem(npcId: number, buyId: number): number | undefined {
        if (!buyId || buyId < 0) return;

        return this.Ids[npcId].items[buyId];
    }
};
