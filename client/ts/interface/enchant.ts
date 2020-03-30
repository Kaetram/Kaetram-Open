import $ from 'jquery';
import Detect from '../utils/detect';
import Packets from '../network/packets';

export default class Enchant {
    game: any;
    interface: any;
    body: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    enchantSlots: JQuery<HTMLElement>;
    selectedItem: JQuery<HTMLElement>;
    selectedShards: JQuery<HTMLElement>;
    confirm: JQuery<HTMLElement>;
    shardsCount: JQuery<HTMLElement>;
    closeEnchant: JQuery<HTMLElement>;
    constructor(game, intrface) {
        this.game = game;
        this.interface = intrface;

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
        const list = this.getSlots();
        const inventoryList = this.interface.bank.getInventoryList();

        list.empty();

        for (let i = 0; i < this.getInventorySize(); i++) {
            const item = $(inventoryList[i]).clone();
            const slot = item.find('#bankInventorySlot' + i);

            slot.click((event) => {
                this.select(event);
            });

            list.append(item);
        }

        this.selectedItem.click(() => {
            this.remove('item');
        });

        this.selectedShards.click(() => {
            this.remove('shards');
        });
    }

    add(type, index) {
        const image = this.getSlot(index).find('#inventoryImage' + index);

        switch (type) {
            case 'item':
                this.selectedItem.css(
                    'background-image',
                    image.css('background-image')
                );

                if (Detect.isMobile())
                    this.selectedItem.css('background-size', '600%');

                break;

            case 'shards':
                this.selectedShards.css(
                    'background-image',
                    image.css('background-image')
                );

                if (Detect.isMobile())
                    this.selectedShards.css('background-size', '600%');

                const count = this.getItemSlot(index).count;

                if (count > 1) this.shardsCount.text(count);

                break;
        }

        image.css('background-image', '');

        this.getSlot(index)
            .find('#inventoryItemCount' + index)
            .text('');
    }

    moveBack(type, index) {
        const image = this.getSlot(index).find('#inventoryImage' + index);
        const itemCount = this.getSlot(index).find(
            '#inventoryItemCount' + index
        );
        const count = this.getItemSlot(index).count;

        switch (type) {
            case 'item':
                if (count > 0)
                    image.css(
                        'background-image',
                        this.selectedItem.css('background-image')
                    );

                if (count > 1) itemCount.text(count);

                this.selectedItem.css('background-image', '');

                break;

            case 'shards':
                if (count > 0)
                    image.css(
                        'background-image',
                        this.selectedShards.css('background-image')
                    );

                if (count > 1) itemCount.text(count);

                this.selectedShards.css('background-image', '');

                this.shardsCount.text('');

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
        this.game.socket.send(Packets.Enchant, [
            Packets.EnchantOpcode.Remove,
            type
        ]);
    }

    getInventorySize() {
        return this.interface.inventory.getSize();
    }

    getItemSlot(index) {
        return this.interface.inventory.container.slots[index];
    }

    display() {
        console.info('Yes hello, I am displaying');

        this.body.fadeIn('fast');
        this.load();
    }

    hide() {
        this.remove('item');
        this.remove('shards');

        this.selectedItem.css('background-image', '');
        this.selectedShards.css('background-image', '');
        this.shardsCount.text('');

        this.body.fadeOut('fast');
    }

    clear() {
        this.enchantSlots.find('ul').empty();

        this.confirm.unbind('click');
        this.closeEnchant.unbind('click');
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
};
