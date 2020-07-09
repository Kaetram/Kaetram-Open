import $ from 'jquery';
import Container from './container/container';
import Packets from '../network/packets';

export default class Bank {
    constructor(game, inventoryContainer, size) {
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
        var self = this,
            bankList = self.bankSlots.find('ul'),
            inventoryList = self.bankInventorySlots.find('ul');

        for (var i = 0; i < data.length; i++) {
            var item = data[i],
                slot = $('<div id="bankSlot' + i + '" class="bankSlot"></div>');

            self.container.setSlot(i, item);

            slot.css({
                'margin-right': 2 * self.getScale() + 'px',
                'margin-bottom': 4 * self.getScale() + 'px',
            });

            var image = $('<div id="bankImage' + i + '" class="bankImage"></div>');

            if (item.string)
                image.css('background-image', self.container.getImageFormat(item.string));

            slot.click(function (event) {
                self.click('bank', event);
            });

            var count = item.count;

            if (count > 999999)
                count = count.toString().substring(0, count.toString().length - 6) + 'M';
            else if (count > 9999) count = count.toString().substring(0, 2) + 'K';
            else if (count === 1) count = '';

            slot.append(image);
            slot.append('<div id="bankItemCount' + i + '" class="itemCount">' + count + '</div>');

            slot.find('#bankItemCount' + i).css({
                'font-size': 4 * self.getScale() + 'px',
                'margin-top': '0',
                'margin-left': '0',
            });

            var bankListItem = $('<li></li>');

            bankListItem.append(slot);

            bankList.append(bankListItem);
        }

        for (var j = 0; j < self.inventoryContainer.size; j++) {
            var iItem = self.inventoryContainer.slots[j],
                iSlot = $('<div id="bankInventorySlot' + j + '" class="bankSlot"></div>');

            iSlot.css({
                'margin-right': 3 * self.getScale() + 'px',
                'margin-bottom': 6 * self.getScale() + 'px',
            });

            var slotImage = $('<div id="inventoryImage' + j + '" class="bankImage"></div>');

            if (iItem.string)
                slotImage.css('background-image', self.container.getImageFormat(iItem.string));

            iSlot.click(function (event) {
                self.click('inventory', event);
            });

            var count = iItem.count;

            if (count > 999999)
                count = count.toString().substring(0, count.toString().length - 6) + 'M';
            else if (count > 9999) count = count.toString().substring(0, 2) + 'K';
            else if (count === 1) count = '';

            iSlot.append(slotImage);
            iSlot.append(
                '<div id="inventoryItemCount' + j + '" class="itemCount">' + count + '</div>'
            );

            iSlot.find('#inventoryItemCount' + j).css({
                'margin-top': '0',
                'margin-left': '0',
            });

            var inventoryListItem = $('<li></li>');

            inventoryListItem.append(iSlot);

            inventoryList.append(inventoryListItem);
        }
    }

    resize() {
        var self = this,
            bankList = self.getBankList(),
            inventoryList = self.getInventoryList();

        for (var i = 0; i < bankList.length; i++) {
            var bankSlot = $(bankList[i]).find('#bankSlot' + i),
                image = bankSlot.find('#bankImage' + i),
                slot = self.container.slots[i];

            bankSlot.css({
                'margin-right': 2 * self.getScale() + 'px',
                'margin-bottom': 4 * self.getScale() + 'px',
            });

            bankSlot.find('#bankItemCount' + i).css({
                'font-size': 4 * self.getScale() + 'px',
                'margin-top': '0',
                'margin-left': '0',
            });

            image.css('background-image', self.container.getImageFormat(slot.string));
        }

        for (var j = 0; j < inventoryList.length; j++) {
            var inventorySlot = $(inventoryList[j]).find('#bankInventorySlot' + j),
                iImage = inventorySlot.find('#inventoryImage' + j),
                iSlot = self.inventoryContainer.slots[j];

            inventorySlot.css({
                'margin-right': 3 * self.getScale() + 'px',
                'margin-bottom': 6 * self.getScale() + 'px',
            });

            iImage.css('background-image', self.container.getImageFormat(iSlot.string));
        }
    }

    click(type, event) {
        var self = this,
            isBank = type === 'bank',
            index = event.currentTarget.id.substring(isBank ? 8 : 17);

        self.game.socket.send(Packets.Bank, [Packets.BankOpcode.Select, type, index]);
    }

    add(info) {
        var self = this,
            item = $(self.getBankList()[info.index]),
            slot = self.container.slots[info.index];

        if (!item || !slot) return;

        if (slot.isEmpty()) slot.load(info.string, info.count, info.ability, info.abilityLevel);

        slot.setCount(info.count);

        var bankSlot = item.find('#bankSlot' + info.index),
            cssSlot = bankSlot.find('#bankImage' + info.index),
            count = bankSlot.find('#bankItemCount' + info.index);

        cssSlot.css('background-image', self.container.getImageFormat(info.string));

        if (self.scale < 3) cssSlot.css('background-size', '600%');

        if (slot.count > 1) count.text(slot.count);
    }

    remove(info) {
        var self = this,
            item = $(self.getBankList()[info.index]),
            slot = self.container.slots[info.index];

        if (!item || !slot) return;

        var divItem = item.find('#bankSlot' + info.index);

        slot.count -= info.count;

        if (slot.count < 1) {
            divItem.find('#bankImage' + info.index).css('background-image', '');
            divItem.find('#bankItemCount' + info.index).text('');

            slot.empty();
        } else divItem.find('#bankItemCount' + info.index).text(slot.count);
    }

    addInventory(info) {
        var self = this,
            item = $(self.getInventoryList()[info.index]);

        if (!item) return;

        var slot = item.find('#bankInventorySlot' + info.index),
            image = slot.find('#inventoryImage' + info.index);

        image.css('background-image', self.container.getImageFormat(info.string));

        if (info.count > 1) slot.find('#inventoryItemCount' + info.index).text(info.count);
    }

    removeInventory(info) {
        var self = this,
            item = $(self.getInventoryList()[info.index]);

        if (!item) return;

        /**
         * All we're doing here is subtracting and updating the count
         * of the items in the inventory first.
         */

        var itemContainer = self.inventoryContainer.slots[info.index],
            slot = item.find('#bankInventorySlot' + info.index),
            diff = itemContainer.count - info.count;

        if (diff > 1) slot.find('#inventoryItemCount' + info.index).text(diff);
        else if (diff === 1) slot.find('#inventoryItemCount' + info.index).text('');
        else {
            slot.find('#inventoryImage' + info.index).css('background-image', '');
            slot.find('#inventoryItemCount' + info.index).text('');
        }
    }

    display() {
        this.body.fadeIn('slow');
    }

    hide() {
        this.body.fadeOut('fast');
    }

    clear() {
        var self = this;

        if (self.bankSlots) self.bankSlots.find('ul').empty();

        if (self.bankInventorySlots) self.bankInventorySlots.find('ul').empty();
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
