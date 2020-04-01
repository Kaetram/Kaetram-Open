import $ from 'jquery';

import Game from '../game';
import Packets from '../network/packets';
import Detect from '../utils/detect';
import Container from './container/container';
import Inventory from './inventory';
import Player from '../entity/character/player/player';

export default class Bank {
    inventoryContainer: Container;
    player: Player;
    body: JQuery<HTMLElement>;
    bankSlots: JQuery<HTMLElement>;
    bankInventorySlots: JQuery<HTMLElement>;
    container: Container;
    close: JQuery<HTMLElement>;

    constructor(public game: Game, inventoryContainer, size) {
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

    load(data) {
        const bankList = this.bankSlots.find('ul');
        const inventoryList = this.bankInventorySlots.find('ul');

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const slot = $(`<div id="bankSlot${i}" class="bankSlot"></div>`);

            this.container.setSlot(i, item);

            slot.css({
                'margin-right': `${2 * this.getScale()}px`,
                'margin-bottom': `${4 * this.getScale()}px`,
            });

            const image = $(`<div id="bankImage${i}" class="bankImage"></div>`);

            if (item.string) {
                image.css(
                    'background-image',
                    this.container.getImageFormat(this.getScale(), item.string)
                );
            }

            slot.click((event) => {
                this.click('bank', event);
            });

            if (Detect.isMobile()) image.css('background-size', '600%');

            let { count } = item;

            if (count > 999999) {
                count = `${count
                    .toString()
                    .substring(0, count.toString().length - 6)}M`;
            } else if (count > 9999) {
                count = `${count.toString().substring(0, 2)}K`;
            } else if (count === 1) count = '';

            slot.append(image);
            slot.append(
                `<div id="bankItemCount${i}" class="itemCount">${count}</div>`
            );

            slot.find(`#bankItemCount${i}`).css({
                'font-size': `${4 * this.getScale()}px`,
                'margin-top': '0',
                'margin-left': '0',
            });

            const bankListItem = $('<li></li>');

            bankListItem.append(slot);

            bankList.append(bankListItem);
        }

        for (let j = 0; j < this.inventoryContainer.size; j++) {
            const iItem = this.inventoryContainer.slots[j];
            const iSlot = $(
                `<div id="bankInventorySlot${j}" class="bankSlot"></div>`
            );

            iSlot.css({
                'margin-right': `${3 * this.getScale()}px`,
                'margin-bottom': `${6 * this.getScale()}px`,
            });

            const slotImage = $(
                `<div id="inventoryImage${j}" class="bankImage"></div>`
            );

            if (iItem.string) {
                slotImage.css(
                    'background-image',
                    this.container.getImageFormat(this.getScale(), iItem.string)
                );
            }

            iSlot.click((event) => {
                this.click('inventory', event);
            });

            if (Detect.isMobile()) slotImage.css('background-size', '600%');

            const { count } = iItem;
            let size: string;

            if (count > 999999) {
                size = `${count
                    .toString()
                    .substring(0, count.toString().length - 6)}M`;
            } else if (count > 9999) {
                size = `${count.toString().substring(0, 2)}K`;
            } else if (count === 1) size = '';

            iSlot.append(slotImage);
            iSlot.append(
                `<div id="inventoryItemCount${j}" class="itemCount">${size}</div>`
            );

            iSlot.find(`#inventoryItemCount${j}`).css({
                'margin-top': '0',
                'margin-left': '0',
            });

            const inventoryListItem = $('<li></li>');

            inventoryListItem.append(iSlot);

            inventoryList.append(inventoryListItem);
        }
    }

    resize() {
        const bankList = this.getBankList();
        const inventoryList = this.getInventoryList();

        for (let i = 0; i < bankList.length; i++) {
            const bankSlot = $(bankList[i]).find(`#bankSlot${i}`);
            const image = bankSlot.find(`#bankImage${i}`);
            const slot = this.container.slots[i];

            bankSlot.css({
                'margin-right': `${2 * this.getScale()}px`,
                'margin-bottom': `${4 * this.getScale()}px`,
            });

            bankSlot.find(`#bankItemCount${i}`).css({
                'font-size': `${4 * this.getScale()}px`,
                'margin-top': '0',
                'margin-left': '0',
            });

            if (Detect.isMobile()) image.css('background-size', '600%');
            else {
                image.css(
                    'background-image',
                    this.container.getImageFormat(this.getScale(), slot.string)
                );
            }
        }

        for (let j = 0; j < inventoryList.length; j++) {
            const inventorySlot = $(inventoryList[j]).find(
                `#bankInventorySlot${j}`
            );
            const iImage = inventorySlot.find(`#inventoryImage${j}`);
            const iSlot = this.inventoryContainer.slots[j];

            inventorySlot.css({
                'margin-right': `${3 * this.getScale()}px`,
                'margin-bottom': `${6 * this.getScale()}px`,
            });

            if (Detect.isMobile()) iImage.css('background-size', '600%');
            else {
                iImage.css(
                    'background-image',
                    this.container.getImageFormat(this.getScale(), iSlot.string)
                );
            }
        }
    }

    click(type, event) {
        const isBank = type === 'bank';
        const index = event.currentTarget.id.substring(isBank ? 8 : 17);

        this.game.socket.send(Packets.Bank, [
            Packets.BankOpcode.Select,
            type,
            index,
        ]);
    }

    add(info) {
        const item = $(this.getBankList()[info.index]);
        const slot = this.container.slots[info.index];

        if (!item || !slot) return;

        if (slot.isEmpty()) {
            slot.load(info.string, info.count, info.ability, info.abilityLevel);
        }

        slot.setCount(info.count);

        const bankSlot = item.find(`#bankSlot${info.index}`);
        const cssSlot = bankSlot.find(`#bankImage${info.index}`);
        const count = bankSlot.find(`#bankItemCount${info.index}`);

        cssSlot.css(
            'background-image',
            this.container.getImageFormat(this.getScale(), info.string)
        );

        if (Detect.isMobile()) cssSlot.css('background-size', '600%');

        if (slot.count > 1) count.text(slot.count);
    }

    remove(info) {
        const item = $(this.getBankList()[info.index]);
        const slot = this.container.slots[info.index];

        if (!item || !slot) return;

        slot.count -= info.count;

        if (slot.count < 1) {
            const divItem = item.find(`#bankSlot${info.index}`);

            divItem.find(`#bankImage${info.index}`).css('background-image', '');
            divItem.find(`#bankItemCount${info.index}`).text('');

            slot.empty();
        }
    }

    addInventory(info) {
        const item = $(this.getInventoryList()[info.index]);

        if (!item) return;

        const slot = item.find(`#bankInventorySlot${info.index}`);
        const image = slot.find(`#inventoryImage${info.index}`);

        image.css(
            'background-image',
            this.container.getImageFormat(this.getScale(), info.string)
        );

        if (Detect.isMobile()) image.css('background-size', '600%');

        if (info.count > 1) {
            slot.find(`#inventoryItemCount${info.index}`).text(info.count);
        }
    }

    removeInventory(info) {
        const item = $(this.getInventoryList()[info.index]);

        if (!item) return;

        /**
         * All we're doing here is subtracting and updating the count
         * of the items in the inventory first.
         */

        const itemContainer = this.inventoryContainer.slots[info.index];
        const slot = item.find(`#bankInventorySlot${info.index}`);
        const diff = itemContainer.count - info.count;

        if (diff > 1) slot.find(`#inventoryItemCount${info.index}`).text(diff);
        else if (diff === 1) {
            slot.find(`#inventoryItemCount${info.index}`).text('');
        } else {
            slot.find(`#inventoryImage${info.index}`).css(
                'background-image',
                ''
            );
            slot.find(`#inventoryItemCount${info.index}`).text('');
        }
    }

    display() {
        this.body.fadeIn('slow');
    }

    hide() {
        this.body.fadeOut('fast');
    }

    clear() {
        if (this.bankSlots) this.bankSlots.find('ul').empty();

        if (this.bankInventorySlots) this.bankInventorySlots.find('ul').empty();
    }

    isVisible() {
        return this.body.css('display') === 'block';
    }

    getScale() {
        return this.game.app.getUIScale();
    }

    getBankList() {
        return this.bankSlots.find('ul').find('li');
    }

    getInventoryList() {
        return this.bankInventorySlots.find('ul').find('li');
    }
}
