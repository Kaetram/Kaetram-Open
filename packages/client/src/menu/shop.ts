import $ from 'jquery';

import { Opcodes, Packets } from '@kaetram/common/network';

import Container from './container/container';

import type { ShopData } from '@kaetram/common/types/info';
import type { ShopSelectData } from '@kaetram/common/types/messages';
import type MenuController from '../controllers/menu';
import type Game from '../game';

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

    private container!: Container;
    private data!: ShopData;
    private openShop = -1;

    private close: JQuery;

    public constructor(private game: Game, private menu: MenuController) {
        this.close = $('#closeShop');

        this.close.css('left', '97%');
        this.close.on('click', () => this.hide());

        this.sellSlot.on('click', () => this.remove());

        this.confirmSell.on('click', () => this.sell());
    }

    private buy(event: JQuery.ClickEvent): void {
        let id = event.currentTarget.id.slice(11);

        this.game.socket.send(Packets.Shop, [Opcodes.Shop.Buy, this.openShop, id, 1]);
    }

    private sell(): void {
        // The server will handle the selected item and verifications.
        this.game.socket.send(Packets.Shop, [Opcodes.Shop.Sell, this.openShop]);
    }

    private select(event: JQuery.ClickEvent): void {
        let id = event.currentTarget.id.slice(17);

        this.game.socket.send(Packets.Shop, [Opcodes.Shop.Select, this.openShop, id]);
    }

    private remove(): void {
        this.game.socket.send(Packets.Shop, [Opcodes.Shop.Remove]);
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
            backgroundImage: this.container.getImageFormat(info.currency),
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

        this.update(this.data);
    }

    public update(data: ShopData): void {
        this.reset();

        this.container = new Container(data.strings.length);

        // Update the global data to current revision
        this.data = data;

        this.load();
    }

    private load(): void {
        // for (let i = 0; i < this.container.size; i++) {
        //     let shop-item = $(`<div id="shop-item${i}" class="shop-item"></div>`),
        //         string = this.data.strings[i],
        //         name = this.data.names[i],
        //         count = this.data.counts[i],
        //         price = this.data.prices[i];
        //     if (!string || !name || !count) continue;
        //     let itemImage = $(`<div id="shop-item-image${i}" class="shop-item-image"></div>`),
        //         item-count = $(`<div id="shop-item-count${i}" class="shop-item-count"></div>`),
        //         itemPrice = $(`<div id="shop-item-price${i}" class="shop-item-price"></div>`),
        //         itemName = $(`<div id="shop-item-name${i}" class="shop-item-name"></div>`),
        //         itemBuy = $(`<div id="shop-item-buy${i}" class="shop-item-buy"></div>`);
        //     itemImage.css('background-image', this.container.getImageFormat(string));
        //     item-count.html(count.toString());
        //     itemPrice.html(`${price}g`);
        //     itemName.html(name);
        //     itemBuy.html('Buy');
        //     this.container.setSlot(i, {
        //         string,
        //         count
        //     });
        //     // Bind the itemBuy to the local buy function.
        //     itemBuy.on('click', (event) => this.buy(event));
        //     let listItem = $('<li></li>');
        //     shop-item.append(itemImage, item-count, itemPrice, itemName, itemBuy);
        //     listItem.append(shop-item);
        //     this.getShopList().append(listItem);
        // }
        // let inventoryItems = this.menu.bank.getInventoryList(),
        //     inventorySize = this.menu.inventory.getSize();
        // for (let j = 0; j < inventorySize; j++) {
        //     let item = $(inventoryItems[j]).clone(),
        //         slot = item.find(`#bankInventorySlot${j}`);
        //     slot.attr('id', `shopInventorySlot${j}`);
        //     slot.on('click', (event) => this.select(event));
        //     this.getInventoryList().append(slot);
        // }
    }

    private reset(): void {
        this.container = null!;

        this.getShopList().empty();
        this.getInventoryList().empty();
    }

    public open(id: number): void {
        if (!id) return;

        this.openShop = id;

        this.body.fadeIn('slow');
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
