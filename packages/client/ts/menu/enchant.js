import $ from 'jquery';
import Packets from '../network/packets';
import log from '../lib/log';
import * as Detect from '../utils/detect';

export default class Enchant {
    constructor(game, menu) {
        this.game = game;
        this.menu = menu;

        this.body = $('#enchant');
        this.container = $('#enchantContainer');
        this.enchantSlots = $('#enchantInventorySlots');

        this.selectedItem = $('#enchantSelectedItem');
        this.selectedShards = $('#enchantShards');
        this.confirm = $('#confirmEnchant');
        this.shardsCount = $('#shardsCount');

        this.closeEnchant = $('#closeEnchant');

        this.confirm.click(() => {
            this.enchant();
        });

        this.closeEnchant.click(() => {
            this.hide();
        });
    }

    resize() {
        this.load();
    }

    load() {
        var self = this,
            list = self.getSlots(),
            inventoryList = self.menu.bank.getInventoryList();

        list.empty();

        for (var i = 0; i < self.getInventorySize(); i++) {
            var item = $(inventoryList[i]).clone(),
                slot = item.find('#bankInventorySlot' + i);

            slot.click(function (event) {
                self.select(event);
            });

            list.append(item);
        }

        self.selectedItem.click(function () {
            self.remove('item');
        });

        self.selectedShards.click(function () {
            self.remove('shards');
        });
    }

    add(type, index) {
        var self = this,
            image = self.getSlot(index).find('#inventoryImage' + index);

        switch (type) {
            case 'item':
                self.selectedItem.css('background-image', image.css('background-image'));

                if (Detect.isMobile()) self.selectedItem.css('background-size', '600%');

                break;

            case 'shards':
                self.selectedShards.css('background-image', image.css('background-image'));

                if (Detect.isMobile()) self.selectedShards.css('background-size', '600%');

                var count = self.getItemSlot(index).count;

                if (count > 1) self.shardsCount.text(count);

                break;
        }

        image.css('background-image', '');

        self.getSlot(index)
            .find('#inventoryItemCount' + index)
            .text('');
    }

    moveBack(type, index) {
        var self = this,
            image = self.getSlot(index).find('#inventoryImage' + index),
            itemCount = self.getSlot(index).find('#inventoryItemCount' + index),
            count = self.getItemSlot(index).count;

        switch (type) {
            case 'item':
                if (count > 0)
                    image.css('background-image', self.selectedItem.css('background-image'));

                if (count > 1) itemCount.text(count);

                self.selectedItem.css('background-image', '');

                break;

            case 'shards':
                if (count > 0)
                    image.css('background-image', self.selectedShards.css('background-image'));

                if (count > 1) itemCount.text(count);

                self.selectedShards.css('background-image', '');

                self.shardsCount.text('');

                break;
        }
    }

    enchant() {
        this.game.socket.send(Packets.Enchant, [Packets.EnchantOpcode.Enchant]);
    }

    select(event) {
        this.game.socket.send(Packets.Enchant, [
            Packets.EnchantOpcode.Select,
            event.currentTarget.id.substring(17)
        ]);
    }

    remove(type) {
        this.game.socket.send(Packets.Enchant, [Packets.EnchantOpcode.Remove, type]);
    }

    getInventorySize() {
        return this.menu.inventory.getSize();
    }

    getItemSlot(index) {
        return this.menu.inventory.container.slots[index];
    }

    display() {
        var self = this;

        log.info('Yes hello, I am displaying');

        self.body.fadeIn('fast');
        self.load();
    }

    hide() {
        var self = this;

        self.remove('item');
        self.remove('shards');

        self.selectedItem.css('background-image', '');
        self.selectedShards.css('background-image', '');
        self.shardsCount.text('');

        self.body.fadeOut('fast');
    }

    clear() {
        var self = this;

        self.enchantSlots.find('ul').empty();

        self.confirm.off('click');
        self.closeEnchant.off('click');
    }

    hasImage(image) {
        return image.css('background-image') !== 'none';
    }

    getSlot(index) {
        return $(this.getSlots().find('li')[index]);
    }

    getSlots() {
        return this.enchantSlots.find('ul');
    }

    isVisible() {
        return this.body.css('display') === 'block';
    }
}
