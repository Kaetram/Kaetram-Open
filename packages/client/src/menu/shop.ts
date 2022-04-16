import _ from 'lodash';

import { SerializedStoreItem } from '@kaetram/common/types/stores';
import { SerializedStoreInfo } from './../../../common/types/stores.d';
import $ from 'jquery';

import { Opcodes, Packets } from '@kaetram/common/network';

import Container from './container/container';

import type { ShopData } from '@kaetram/common/types/info';
import type { ShopSelectData } from '@kaetram/common/types/messages';
import type MenuController from '../controllers/menu';
import type Game from '../game';

import Utils from '@kaetram/common/util/utils';

export default class Shop {
    private body = $('#shop');
    private shop = $('#shop-container');
    private inventory = $('#shop-inventory-slots');

    /**
     * Represents what the player currently has queued for sale
     * and `sellSlotReturn` shows the currency the player is receiving.
     * The reason for this is because shops are written such that
     * they can handle different currencies.
     */
    private sellSlot = $('#shop-sell-slot');
    private sellSlotText = $('#shop-sell-slot-text');
    private sellSlotReturn = $('#shop-sell-slot-return');
    private sellSlotReturnText = $('#shop-sell-slot-return-text');

    private confirmSell = $('#confirm-sell');

    private container: Container = new Container();
    private openShop = -1;

    private close: JQuery;

    public constructor(private game: Game, private menu: MenuController) {
        this.close = $('#close-shop');

        this.close.css('left', '97%');
        this.close.on('click', () => this.hide());

        this.sellSlot.on('click', () => this.remove());

        this.confirmSell.on('click', () => this.sell());
    }

    private buy(event: JQuery.ClickEvent): void {
        let id = event.currentTarget.id.slice(11);

        this.game.socket.send(Packets.Store, [Opcodes.Store.Buy, this.openShop, id, 1]);
    }

    private sell(): void {
        // The server will handle the selected item and verifications.
        this.game.socket.send(Packets.Store, [Opcodes.Store.Sell, this.openShop]);
    }

    private select(event: JQuery.ClickEvent): void {
        let id = event.currentTarget.id.slice(17);

        this.game.socket.send(Packets.Store, [Opcodes.Store.Select, this.openShop, id]);
    }

    private remove(): void {
        this.game.socket.send(Packets.Store, [Opcodes.Store.Remove]);
    }

    public move(info: ShopSelectData): void {
        let inventorySlot = this.getInventoryList().find(`#shopInventorySlot${info.slotId}`),
            slotImage = inventorySlot.find(`#inventoryImage${info.slotId}`),
            slotText = inventorySlot.find(`#inventory-item-count${info.slotId}`);

        this.sellSlot.css({
            backgroundImage: slotImage.css('background-image'),
            backgroundSize: slotImage.css('background-size')
        });

        this.sellSlotReturn.css({
            backgroundImage: Utils.getImageURL(info.currency),
            backgroundSize: this.sellSlot.css('background-size')
        });

        let quantity: number = Number(slotText.text()) || 1;

        this.sellSlotText.text(slotText.text());

        this.sellSlotReturnText.text(info.price * quantity);

        slotImage.css('background-image', '');
        slotText.text('');
    }

    public moveBack(index: number): void {
        let inventorySlot = this.getInventoryList().find(`#shopInventorySlot${index}`);

        inventorySlot
            .find(`#inventoryImage${index}`)
            .css('background-image', this.sellSlot.css('background-image'));

        inventorySlot.find(`#inventory-item-count${index}`).text(this.sellSlotText.text());

        this.sellSlot.css('background-image', '');
        this.sellSlotText.text('');
        this.sellSlotReturn.css('background-image', '');
        this.sellSlotReturnText.text('');
    }

    /**
     * The shop file is already built to support full de-initialization of objects when
     * we receive an update about the stocks. So we just use that whenever we want to resize.
     * This is just a temporary fix, in reality, we do not want anyone to actually see the shop
     * do a full refresh when they buy an item or someone else buys an item.
     */
    public resize(): void {
        this.getInventoryList().empty();
        this.getShopList().empty();

        this.load();

        //this.update(this.data);
    }

    public update(items: SerializedStoreItem[]): void {
        this.reset();

        this.container = new Container(items.length);

        _.each(items, (item, index) =>
            this.container.add({
                index,
                key: item.key,
                count: item.count,
                name: item.name
            })
        );

        this.load();
    }

    private load(): void {
        _.each(this.container.slots, (slot) => {
            let storeItem = $(`<div id="shopItem${slot.index}" class="shop-item"></div>`),
                image = $(`<div id="shopItemImage${slot.index}" class="shop-item-image"></div>`),
                count = $(`<div id="shopItemCount${slot.index}" class="shop-item-count"></div>`),
                price = $(`<div id="shopItemPrice${slot.index}" class="shop-item-price"></div>`),
                name = $(`<div id="shopItemName${slot.index}" class="shop-item-name"></div>`),
                buy = $(`<div id="shopItemBuy${slot.index}" class="shop-item-buy"></div>`);

            image.css('background-image', Utils.getImageURL(slot.key));
            count.text(slot.count);
            price.text(slot.price);
            name.text(slot.name);
            buy.html('Buy');

            buy.on('click', (event) => this.buy(event));

            let listItem = $('<li></li>');

            storeItem.append(image, count, price, name, buy);

            listItem.append(storeItem);

            this.getShopList().append(listItem);
        });

        let inventoryItems = this.menu.bank.getInventoryList(),
            inventorySize = this.menu.inventory.getSize();

        for (let j = 0; j < inventorySize; j++) {
            let item = $(inventoryItems[j]).clone(),
                slot = item.find(`#bankInventorySlot${j}`);

            slot.attr('id', `shopInventorySlot${j}`);

            slot.on('click', (event) => this.select(event));

            this.getInventoryList().append(slot);
        }
    }

    private reset(): void {
        this.container = new Container();

        this.getShopList().empty();
        this.getInventoryList().empty();
    }

    public open(store: SerializedStoreInfo): void {
        this.body.fadeIn('slow');

        this.update(store.items);
    }

    public hide(): void {
        this.openShop = -1;

        this.sellSlot.css('background-image', '');
        this.sellSlotText.text('');
        this.sellSlotReturn.css('background-image', '');
        this.sellSlotReturnText.text('');

        this.body.fadeOut('fast');
    }

    public clear(): void {
        this.shop?.find('ul').empty();

        this.inventory?.find('ul').empty();

        this.close?.off('click');

        this.sellSlot?.off('click');

        this.confirmSell?.off('click');
    }

    // getScale(): number {
    //     return this.game.renderer.getScale();
    // }

    public isVisible(): boolean {
        return this.body.css('display') === 'block';
    }

    public isShopOpen(shopId: number): boolean {
        return this.isVisible() && this.openShop === shopId;
    }

    private getShopList(): JQuery<HTMLUListElement> {
        return this.shop.find('ul');
    }

    private getInventoryList(): JQuery<HTMLUListElement> {
        return this.inventory.find('ul');
    }
}
