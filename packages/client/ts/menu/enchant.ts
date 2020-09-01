import $ from 'jquery';
import Packets from '../network/packets';
import log from '../lib/log';
import * as Detect from '../utils/detect';
import Game from '../game';
import MenuController from '../controllers/menu';
import Slot from './container/slot';

export default class Enchant {
    game: Game;
    menu: MenuController;
    body: JQuery;
    container: JQuery;
    enchantSlots: JQuery;
    selectedItem: JQuery;
    selectedShards: JQuery;
    confirm: JQuery;
    shardsCount: JQuery;
    closeEnchant: JQuery;

    constructor(game: Game, menu: MenuController) {
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

    resize(): void {
        this.load();
    }

    load(): void {
        const list = this.getSlots(),
            inventoryList = this.menu.bank.getInventoryList();

        list.empty();

        for (let i = 0; i < this.getInventorySize(); i++) {
            const item = $(inventoryList[i]).clone(),
                slot = item.find(`#bankInventorySlot${i}`);

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

    add(type: string, index: number): void {
        const image = this.getSlot(index).find(`#inventoryImage${index}`);

        switch (type) {
            case 'item':
                this.selectedItem.css('background-image', image.css('background-image'));

                if (Detect.isMobile()) this.selectedItem.css('background-size', '600%');

                break;

            case 'shards': {
                this.selectedShards.css('background-image', image.css('background-image'));

                if (Detect.isMobile()) this.selectedShards.css('background-size', '600%');

                const count = this.getItemSlot(index).count;

                if (count > 1) this.shardsCount.text(count);

                break;
            }
        }

        image.css('background-image', '');

        this.getSlot(index).find(`#inventoryItemCount${index}`).text('');
    }

    moveBack(type: string, index: number): void {
        const image = this.getSlot(index).find(`#inventoryImage${index}`),
            itemCount = this.getSlot(index).find(`#inventoryItemCount${index}`),
            count = this.getItemSlot(index).count;

        switch (type) {
            case 'item':
                if (count > 0)
                    image.css('background-image', this.selectedItem.css('background-image'));

                if (count > 1) itemCount.text(count);

                this.selectedItem.css('background-image', '');

                break;

            case 'shards':
                if (count > 0)
                    image.css('background-image', this.selectedShards.css('background-image'));

                if (count > 1) itemCount.text(count);

                this.selectedShards.css('background-image', '');

                this.shardsCount.text('');

                break;
        }
    }

    enchant(): void {
        this.game.socket.send(Packets.Enchant, [Packets.EnchantOpcode.Enchant]);
    }

    select(event: JQuery.ClickEvent): void {
        this.game.socket.send(Packets.Enchant, [
            Packets.EnchantOpcode.Select,
            event.currentTarget.id.substring(17)
        ]);
    }

    remove(type: string): void {
        this.game.socket.send(Packets.Enchant, [Packets.EnchantOpcode.Remove, type]);
    }

    getInventorySize(): number {
        return this.menu.inventory.getSize();
    }

    getItemSlot(index: number): Slot {
        return this.menu.inventory.container.slots[index];
    }

    display(): void {
        log.info('Yes hello, I am displaying');

        this.body.fadeIn('fast');
        this.load();
    }

    hide(): void {
        this.remove('item');
        this.remove('shards');

        this.selectedItem.css('background-image', '');
        this.selectedShards.css('background-image', '');
        this.shardsCount.text('');

        this.body.fadeOut('fast');
    }

    clear(): void {
        this.enchantSlots.find('ul').empty();

        this.confirm.off('click');
        this.closeEnchant.off('click');
    }

    hasImage(image: JQuery): boolean {
        return image.css('background-image') !== 'none';
    }

    getSlot(index: number): JQuery<HTMLLIElement> {
        return $(this.getSlots().find('li')[index]);
    }

    getSlots(): JQuery<HTMLUListElement> {
        return this.enchantSlots.find('ul');
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
