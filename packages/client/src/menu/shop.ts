import $ from 'jquery';

import MenuController from '../controllers/menu';
import Player from '../entity/character/player/player';
import Game from '../game';
import Packets from '@kaetram/common/src/packets';
import Container from './container/container';

interface ShopMoveInfo {
    id: string;
    slotId: string;
    currency: string;
    price: number;
}

interface ShopData {
    id: number;
    strings: string[];
    names: string[];
    counts: number[];
    prices: number[];
}

export default class Shop {
    game: Game;
    body: JQuery;
    shop: JQuery;
    inventory: JQuery;
    sellSlot: JQuery;
    sellSlotText: JQuery;
    sellSlotReturn: JQuery;
    sellSlotReturnText: JQuery;
    confirmSell: JQuery;
    player: Player;
    menu: MenuController;
    container: Container;
    data: ShopData;
    openShop: number;
    items: [];
    counts: [];
    close: JQuery;

    constructor(game: Game, menu: MenuController) {
        this.game = game;

        this.body = $('#shop');
        this.shop = $('#shopContainer');
        this.inventory = $('#shopInventorySlots');

        /**
         * sellSlot represents what the player currently has queued for sale
         * and sellSlotReturn shows the currency the player is receiving.
         * The reason for this is because shops are written such that
         * they can handle different currencies.
         */

        this.sellSlot = $('#shopSellSlot');
        this.sellSlotText = $('#shopSellSlotText');
        this.sellSlotReturn = $('#shopSellSlotReturn');
        this.sellSlotReturnText = $('#shopSellSlotReturnText');

        this.confirmSell = $('#confirmSell');

        this.player = game.player;
        this.menu = menu;

        this.container = null!;
        this.data = null!;

        this.openShop = -1;

        this.items = [];
        this.counts = [];

        this.close = $('#closeShop');

        this.close.css('left', '97%');
        this.close.on('click', () => this.hide());

        this.sellSlot.on('click', () => this.remove());

        this.confirmSell.on('click', () => this.sell());
    }

    buy(event: JQuery.ClickEvent): void {
        const id = event.currentTarget.id.slice(11);

        this.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Buy, this.openShop, id, 1]);
    }

    sell(): void {
        // The server will handle the selected item and verifications.
        this.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Sell, this.openShop]);
    }

    select(event: JQuery.ClickEvent): void {
        const id = event.currentTarget.id.slice(17);

        this.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Select, this.openShop, id]);
    }

    remove(): void {
        this.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Remove]);
    }

    async move(info: ShopMoveInfo): Promise<void> {
        const inventorySlot = this.getInventoryList().find(`#shopInventorySlot${info.slotId}`);
        const slotImage = inventorySlot.find(`#inventoryImage${info.slotId}`);
        const slotText = inventorySlot.find(`#inventoryItemCount${info.slotId}`);

        this.sellSlot.css({
            backgroundImage: slotImage.css('background-image'),
            backgroundSize: slotImage.css('background-size')
        });

        this.sellSlotReturn.css({
            backgroundImage: await this.container.getImageFormat(info.currency),
            backgroundSize: this.sellSlot.css('background-size')
        });

        var quantity: number = Number(slotText.text()) || 1;

        this.sellSlotText.text(slotText.text());

        this.sellSlotReturnText.text(info.price * quantity);

        slotImage.css('background-image', '');
        slotText.text('');
    }

    moveBack(index: number): void {
        const inventorySlot = this.getInventoryList().find(`#shopInventorySlot${index}`);

        inventorySlot
            .find(`#inventoryImage${index}`)
            .css('background-image', this.sellSlot.css('background-image'));
        
        inventorySlot
            .find(`#inventoryItemCount${index}`)
            .text(this.sellSlotText.text());

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
    resize(): void {
        this.getInventoryList().empty();
        this.getShopList().empty();

        this.update(this.data);
    }

    update(data: ShopData): void {
        this.reset();

        this.container = new Container(data.strings.length);

        // Update the global data to current revision
        this.data = data;

        this.load();
    }

    async load(): Promise<void> {
        for (let i = 0; i < this.container.size; i++) {
            const shopItem = $(`<div id="shopItem${i}" class="shopItem"></div>`);
            const string = this.data.strings[i];
            const name = this.data.names[i];
            const count = this.data.counts[i];
            const price = this.data.prices[i];

            if (!string || !name || !count) continue;

            const itemImage = $(`<div id="shopItemImage${i}" class="shopItemImage"></div>`);
            const itemCount = $(`<div id="shopItemCount${i}" class="shopItemCount"></div>`);
            const itemPrice = $(`<div id="shopItemPrice${i}" class="shopItemPrice"></div>`);
            const itemName = $(`<div id="shopItemName${i}" class="shopItemName"></div>`);
            const itemBuy = $(`<div id="shopItemBuy${i}" class="shopItemBuy"></div>`);

            itemImage.css('background-image', await this.container.getImageFormat(string));
            itemCount.html(count.toString());
            itemPrice.html(`${price}g`);
            itemName.html(name);
            itemBuy.html('Buy');

            this.container.setSlot(i, {
                string,
                count
            });

            // Bind the itemBuy to the local buy function.
            itemBuy.on('click', (event) => this.buy(event));

            const listItem = $('<li></li>');

            shopItem.append(itemImage, itemCount, itemPrice, itemName, itemBuy);

            listItem.append(shopItem);

            this.getShopList().append(listItem);
        }

        const inventoryItems = this.menu.bank.getInventoryList();
        const inventorySize = this.menu.inventory.getSize();

        for (let j = 0; j < inventorySize; j++) {
            const item = $(inventoryItems[j]).clone();
            const slot = item.find(`#bankInventorySlot${j}`);

            slot.attr('id', `shopInventorySlot${j}`);

            slot.on('click', (event) => this.select(event));

            this.getInventoryList().append(slot);
        }
    }

    reset(): void {
        this.items = [];
        this.counts = [];

        this.container = null!;

        this.getShopList().empty();
        this.getInventoryList().empty();
    }

    open(id: number): void {
        if (!id) return;

        this.openShop = id;

        this.body.fadeIn('slow');
    }

    hide(): void {
        this.openShop = -1;

        this.sellSlot.css('background-image', '');
        this.sellSlotText.text('');
        this.sellSlotReturn.css('background-image', '');
        this.sellSlotReturnText.text('');

        this.body.fadeOut('fast');
    }

    clear(): void {
        this.shop?.find('ul').empty();

        this.inventory?.find('ul').empty();

        this.close?.off('click');

        this.sellSlot?.off('click');

        this.confirmSell?.off('click');
    }

    getScale(): number {
        return this.game.renderer.getScale();
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }

    isShopOpen(shopId: number): boolean {
        return this.isVisible() && this.openShop === shopId;
    }

    getShopList(): JQuery<HTMLUListElement> {
        return this.shop.find('ul');
    }

    getInventoryList(): JQuery<HTMLUListElement> {
        return this.inventory.find('ul');
    }
}
