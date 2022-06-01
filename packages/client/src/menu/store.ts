import Menu from './menu';

import { StorePacket } from '@kaetram/common/types/messages/outgoing';

export default class Store extends Menu {
    private key = '';

    public constructor() {
        super('#store', '#close-store');
    }

    /**
     * Displays the store UI and updates the items
     * in the store inventory.
     * @param info Store packet data containing information about the store.
     */

    public override show(info: StorePacket): void {
        super.show();
    }

    private clear(): void {
        //
    }
}

// import _ from 'lodash';
// import $ from 'jquery';

// import { SerializedStoreItem } from '@kaetram/common/types/stores';

// import { Packets, Opcodes } from '@kaetram/common/network';

// import Utils from '../utils/util';
// import Slot from './container/slot';
// import Container from './container/container';

// import type Game from '../game';
// import type MenuController from '../controllers/menu';
// import { StorePacket } from '@kaetram/common/types/messages/outgoing';

// export default class Shop {
//     private body = $('#shop');
//     private shop = $('#shop-container');
//     private inventory = $('#shop-inventory-slots');

//     /**
//      * Represents what the player currently has queued for sale
//      * and `sellSlotReturn` shows the currency the player is receiving.
//      * The reason for this is because shops are written such that
//      * they can handle different currencies.
//      */
//     private sellSlot = $('#shop-sell-slot');
//     private sellSlotText = $('#shop-sell-slot-text');
//     private sellSlotReturn = $('#shop-sell-slot-return');
//     private sellSlotReturnText = $('#shop-sell-slot-return-text');

//     private confirmSell = $('#confirm-sell');

//     private container: Container = new Container();

//     // Identification/key of the currently opened store.
//     private key = '';

//     // Currency of the current store, defaults to gold.
//     private currency = 'gold';

//     // Temporary item selected for when user tries to sell.
//     private selectedItem: SerializedStoreItem | undefined;

//     private close: JQuery;

//     public constructor(private game: Game, private menu: MenuController) {
//         this.close = $('#close-shop');

//         this.close.css('left', '97%');
//         this.close.on('click', () => this.hide());

//         this.sellSlot.on('click', () => this.remove());

//         this.confirmSell.on('click', () => this.sell());
//     }

//     private buy(item: Slot, count = 1): void {
//         this.game.socket.send(Packets.Store, {
//             opcode: Opcodes.Store.Buy,
//             storeKey: this.key,
//             itemKey: item.key,
//             count
//         });
//     }

//     private sell(): void {
//         if (!this.selectedItem) return;

//         this.clearSellSlot();

//         // The server will handle the selected item and verifications.
//         this.game.socket.send(Packets.Store, {
//             opcode: Opcodes.Store.Sell,
//             storeKey: this.key,
//             itemKey: this.selectedItem.key,
//             count: this.selectedItem.count,
//             index: this.selectedItem.index
//         });
//     }

//     /**
//      * Selects an item in order to get the price and check
//      * if the item exists in the store already. The rest is
//      * handled client-sided after the response is received.
//      * @param item The slot we are checking.
//      */

//     private select(item: Slot, index: number): void {
//         // Slot is empty, ignore.
//         if (!item.key) return;

//         this.game.socket.send(Packets.Store, {
//             opcode: Opcodes.Store.Select,
//             storeKey: this.key,
//             itemKey: item.key,
//             index
//         });
//     }

//     /**
//      * Moves the item back, clears the sell slot
//      * and reloads the shops/inventory.
//      */

//     private remove(): void {
//         this.moveBack(this.selectedItem!.index!);
//         this.clearSellSlot();
//         this.resize();

//         this.selectedItem = undefined;
//     }

//     /**
//      * Moves an item from the inventory to the sell slot.
//      * @param item The store item we are moving.
//      */

//     public move(item: SerializedStoreItem): void {
//         // Refresh everything.
//         this.resize();

//         let inventorySlot = this.getInventoryList().find(`#shopInventorySlot${item.index}`),
//             slotImage = inventorySlot.find(`#shopInventoryImage${item.index}`),
//             slotCount = inventorySlot.find(`#shopInventoryCount${item.index}`);

//         this.sellSlot.css({
//             backgroundImage: slotImage.css('background-image'),
//             backgroundSize: slotImage.css('background-size')
//         });

//         this.sellSlotReturn.css({
//             backgroundImage: Utils.getImageURL(this.currency),
//             backgroundSize: this.sellSlot.css('background-size')
//         });

//         this.sellSlotText.text(slotCount.text());
//         this.sellSlotReturnText.text(item.price * item.count);

//         slotImage.css('background-image', '');
//         slotCount.text('');

//         this.selectedItem = item;
//     }

//     /**
//      * Puts the item back from the sell slot.
//      * @param index The index of the item in the inventory.
//      */

//     public moveBack(index: number): void {
//         if (!index) return;

//         let inventorySlot = this.getInventoryList().find(`#shopInventorySlot${index}`);

//         inventorySlot
//             .find(`#inventoryImage${index}`)
//             .css('background-image', this.sellSlot.css('background-image'));

//         inventorySlot.find(`#inventory-item-count${index}`).text(this.sellSlotText.text());
//     }

//     /**
//      * Clears the sell slot and the return slot that shows
//      * how many coins the player is getting back.
//      */

//     public clearSellSlot(): void {
//         this.sellSlot.css('background-image', '');
//         this.sellSlotText.text('');
//         this.sellSlotReturn.css('background-image', '');
//         this.sellSlotReturnText.text('');
//     }

//     /**
//      * The shop file is already built to support full de-initialization of objects when
//      * we receive an update about the stocks. So we just use that whenever we want to resize.
//      * This is just a temporary fix, in reality, we do not want anyone to actually see the shop
//      * do a full refresh when they buy an item or someone else buys an item.
//      */

//     public resize(): void {
//         this.getInventoryList().empty();
//         this.getShopList().empty();

//         this.load();
//     }

//     public open(store: StorePacket): void {
//         this.key = store.key!;
//         this.currency = store.currency!;

//         this.body.fadeIn('slow');

//         this.update(store.items!);
//     }

//     public update(items: SerializedStoreItem[]): void {
//         this.container = new Container();

//         this.reset();

//         _.each(items, (item, index) =>
//             this.container.add({
//                 index,
//                 key: item.key,
//                 count: item.count,
//                 name: item.name,
//                 price: item.price
//             })
//         );

//         this.load();
//     }

//     private load(): void {
//         _.each(this.container.slots, (slot) => {
//             let storeItem = $(`<div id="shopItem${slot.index}" class="shop-item"></div>`),
//                 image = $(`<div id="shopItemImage${slot.index}" class="shop-item-image"></div>`),
//                 count = $(`<div id="shopItemCount${slot.index}" class="shop-item-count"></div>`),
//                 price = $(`<div id="shopItemPrice${slot.index}" class="shop-item-price"></div>`),
//                 name = $(`<div id="shopItemName${slot.index}" class="shop-item-name"></div>`),
//                 buy = $(`<div id="shopItemBuy${slot.index}" class="shop-item-buy"></div>`);

//             image.css('background-image', Utils.getImageURL(slot.key));
//             count.text(slot.count);
//             price.text(`${slot.price} ${this.currency.slice(0, 1).toUpperCase()}`);
//             name.text(slot.name);
//             buy.html('Buy');

//             buy.on('click', () => this.buy(slot));

//             let listItem = $('<li></li>');

//             storeItem.append(image, count, price, name, buy);

//             listItem.append(storeItem);

//             this.getShopList().append(listItem);
//         });

//         let inventoryContainer = this.menu.inventory.container;

//         for (let j = 0; j < inventoryContainer.size; j++) {
//             let item = inventoryContainer.slots[j],
//                 slot = $(`<div id="shopInventorySlot${j}" class="bank-slot"></div>`),
//                 count = $(`<div id="shopInventoryCount${j}" class="item-count"></div>`),
//                 image = $(`<div id="shopInventoryImage${j}" class="bank-image"></div>`),
//                 element = $('<li></li>').append(slot.append(image).append(count));

//             slot.css({
//                 marginRight: `${3 * this.getScale()}px`,
//                 marginBottom: `${6 * this.getScale()}px`
//             });

//             count.css('margin-top', `${1 * this.getScale()}px`);

//             if (item.key) image.css('background-image', Utils.getImageURL(item.key));

//             if (item.count > 1) count.text(item.count);

//             slot.on('click', () => this.select(item, j));

//             this.getInventoryList().append(element);
//         }
//     }

//     private reset(): void {
//         this.getShopList().empty();
//         this.getInventoryList().empty();
//     }

//     public hide(): void {
//         this.key = '';

//         this.sellSlot.css('background-image', '');
//         this.sellSlotText.text('');
//         this.sellSlotReturn.css('background-image', '');
//         this.sellSlotReturnText.text('');

//         this.body.fadeOut('fast');
//     }

//     public clear(): void {
//         this.shop?.find('ul').empty();

//         this.inventory?.find('ul').empty();

//         this.close?.off('click');

//         this.sellSlot?.off('click');

//         this.confirmSell?.off('click');
//     }

//     private getScale(): number {
//         return this.game.app.getUIScale();
//     }

//     public isVisible(): boolean {
//         return this.body.css('display') === 'block';
//     }

//     private getShopList(): JQuery<HTMLUListElement> {
//         return this.shop.find('ul');
//     }

//     private getInventoryList(): JQuery<HTMLUListElement> {
//         return this.inventory.find('ul');
//     }
// }
