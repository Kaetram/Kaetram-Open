import $ from 'jquery';

import Player from '../entity/character/player/player';
import Game from '../game';
import Packets from '../network/packets';
import Container from './container/container';
import Slot from './container/slot';

export default class Bank {
    game: Game;
    inventoryContainer: Container;
    player: Player;
    body: JQuery<HTMLElement>;
    bankSlots: JQuery<HTMLElement>;
    bankInventorySlots: JQuery<HTMLElement>;
    container: Container;
    close: JQuery<HTMLElement>;
    scale: number;

    constructor(game: Game, inventoryContainer: Container, size: number) {
        this.game = game;
        this.inventoryContainer = inventoryContainer;

        this.player = game.player;

        this.body = $('#bank');
        this.bankSlots = $('#bankSlots');
        this.bankInventorySlots = $('#bankInventorySlots');

        this.container = new Container(size);
        this.close = $('#closeBank');

        this.close.css('left', '97%');
        this.close.click(() => {
            this.hide();
        });
    }

    async load(data: Slot[]): Promise<void> {
        const bankList = this.bankSlots.find('ul'),
            inventoryList = this.bankInventorySlots.find('ul');

        for (let i = 0; i < data.length; i++) {
            const item = data[i],
                slot = $(`<div id="bankSlot${i}" class="bankSlot"></div>`);

            this.container.setSlot(i, item);

            slot.css({
                'margin-right': `${2 * this.getScale()}px`,
                'margin-bottom': `${4 * this.getScale()}px`
            });

            const image = $(`<div id="bankImage${i}" class="bankImage"></div>`);

            if (item.string)
                image.css('background-image', await this.container.getImageFormat(item.string));

            slot.click((event) => {
                this.click('bank', event);
            });

            const count = item.count;
            let itemCount: string;

            if (count > 999999)
                itemCount = `${count.toString().substring(0, count.toString().length - 6)}M`;
            else if (count > 9999) itemCount = `${count.toString().substring(0, 2)}K`;
            else if (count === 1) itemCount = '';

            slot.append(image);
            slot.append(`<div id="bankItemCount${i}" class="itemCount">${itemCount}</div>`);

            slot.find(`#bankItemCount${i}`).css({
                'font-size': `${4 * this.getScale()}px`,
                'margin-top': '0',
                'margin-left': '0'
            });

            const bankListItem = $('<li></li>');

            bankListItem.append(slot);

            bankList.append(bankListItem);
        }

        for (let j = 0; j < this.inventoryContainer.size; j++) {
            const iItem = this.inventoryContainer.slots[j],
                iSlot = $(`<div id="bankInventorySlot${j}" class="bankSlot"></div>`);

            iSlot.css({
                'margin-right': `${3 * this.getScale()}px`,
                'margin-bottom': `${6 * this.getScale()}px`
            });

            const slotImage = $(`<div id="inventoryImage${j}" class="bankImage"></div>`);

            if (iItem.string)
                slotImage.css(
                    'background-image',
                    await this.container.getImageFormat(iItem.string)
                );

            iSlot.click((event) => {
                this.click('inventory', event);
            });

            const count = iItem.count;
            let itemCount;

            if (count > 999999)
                itemCount = `${count.toString().substring(0, count.toString().length - 6)}M`;
            else if (count > 9999) itemCount = `${count.toString().substring(0, 2)}K`;
            else if (count === 1) itemCount = '';

            iSlot.append(slotImage);
            iSlot.append(`<div id="inventoryItemCount${j}" class="itemCount">${itemCount}</div>`);

            iSlot.find(`#inventoryItemCount${j}`).css({
                'margin-top': '0',
                'margin-left': '0'
            });

            const inventoryListItem = $('<li></li>');

            inventoryListItem.append(iSlot);

            inventoryList.append(inventoryListItem);
        }
    }

    async resize(): Promise<void> {
        const bankList = this.getBankList(),
            inventoryList = this.getInventoryList();

        for (let i = 0; i < bankList.length; i++) {
            const bankSlot = $(bankList[i]).find(`#bankSlot${i}`),
                image = bankSlot.find(`#bankImage${i}`),
                slot = this.container.slots[i];

            bankSlot.css({
                'margin-right': `${2 * this.getScale()}px`,
                'margin-bottom': `${4 * this.getScale()}px`
            });

            bankSlot.find(`#bankItemCount${i}`).css({
                'font-size': `${4 * this.getScale()}px`,
                'margin-top': '0',
                'margin-left': '0'
            });

            image.css('background-image', await this.container.getImageFormat(slot.string));
        }

        for (let j = 0; j < inventoryList.length; j++) {
            const inventorySlot = $(inventoryList[j]).find(`#bankInventorySlot${j}`),
                iImage = inventorySlot.find(`#inventoryImage${j}`),
                iSlot = this.inventoryContainer.slots[j];

            inventorySlot.css({
                'margin-right': `${3 * this.getScale()}px`,
                'margin-bottom': `${6 * this.getScale()}px`
            });

            iImage.css('background-image', await this.container.getImageFormat(iSlot.string));
        }
    }

    click(type: string, event: JQuery.ClickEvent): void {
        const isBank = type === 'bank',
            index = event.currentTarget.id.substring(isBank ? 8 : 17);

        this.game.socket.send(Packets.Bank, [Packets.BankOpcode.Select, type, index]);
    }

    async add(info: Slot): Promise<void> {
        const item = $(this.getBankList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        if (slot.isEmpty()) slot.load(info.string, info.count, info.ability, info.abilityLevel);

        slot.setCount(info.count);

        const bankSlot = item.find(`#bankSlot${info.index}`),
            cssSlot = bankSlot.find(`#bankImage${info.index}`),
            count = bankSlot.find(`#bankItemCount${info.index}`);

        cssSlot.css('background-image', await this.container.getImageFormat(info.string));

        if (this.scale < 3) cssSlot.css('background-size', '600%');

        if (slot.count > 1) count.text(slot.count);
    }

    remove(info: Slot): void {
        const item = $(this.getBankList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        const divItem = item.find(`#bankSlot${info.index}`);

        slot.count -= info.count;

        if (slot.count < 1) {
            divItem.find(`#bankImage${info.index}`).css('background-image', '');
            divItem.find(`#bankItemCount${info.index}`).text('');

            slot.empty();
        } else divItem.find(`#bankItemCount${info.index}`).text(slot.count);
    }

    async addInventory(info: Slot): Promise<void> {
        const item = $(this.getInventoryList()[info.index]);

        if (!item) return;

        const slot = item.find(`#bankInventorySlot${info.index}`),
            image = slot.find(`#inventoryImage${info.index}`);

        image.css('background-image', await this.container.getImageFormat(info.string));

        if (info.count > 1) slot.find(`#inventoryItemCount${info.index}`).text(info.count);
    }

    removeInventory(info: Slot): void {
        const item = $(this.getInventoryList()[info.index]);

        if (!item) return;

        /**
         * All we're doing here is subtracting and updating the count
         * of the items in the inventory first.
         */

        const itemContainer = this.inventoryContainer.slots[info.index],
            slot = item.find(`#bankInventorySlot${info.index}`),
            diff = itemContainer.count - info.count;

        if (diff > 1) slot.find(`#inventoryItemCount${info.index}`).text(diff);
        else if (diff === 1) slot.find(`#inventoryItemCount${info.index}`).text('');
        else {
            slot.find(`#inventoryImage${info.index}`).css('background-image', '');
            slot.find(`#inventoryItemCount${info.index}`).text('');
        }
    }

    display(): void {
        this.body.fadeIn('slow');
    }

    hide(): void {
        this.body.fadeOut('fast');
    }

    clear(): void {
        if (this.bankSlots) this.bankSlots.find('ul').empty();

        if (this.bankInventorySlots) this.bankInventorySlots.find('ul').empty();
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }

    getScale(): number {
        return this.game.app.getUIScale();
    }

    getBankList(): JQuery<HTMLLIElement> {
        return this.bankSlots.find('ul').find('li');
    }

    getInventoryList(): JQuery<HTMLLIElement> {
        return this.bankInventorySlots.find('ul').find('li');
    }
}
