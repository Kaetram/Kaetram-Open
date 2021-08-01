import $ from 'jquery';

import { Packets, Opcodes } from '@kaetram/common/network';

import log from '../lib/log';
import * as Detect from '../utils/detect';

import type MenuController from '../controllers/menu';
import type Game from '../game';
import type Slot from './container/slot';

export default class Enchant {
    private body = $('#enchant');
    // private container = $('#enchantContainer');
    private enchantSlots = $('#enchantInventorySlots');

    private selectedItem = $('#enchantSelectedItem');
    private selectedShards = $('#enchantShards');
    private confirm = $('#confirmEnchant');
    private shardsCount = $('#shardsCount');

    private closeEnchant = $('#closeEnchant');

    public constructor(private game: Game, private menu: MenuController) {
        this.confirm.on('click', () => this.enchant());

        this.closeEnchant.on('click', () => this.hide());
    }

    public resize(): void {
        this.load();
    }

    private load(): void {
        let list = this.getSlots(),
            inventoryList = this.menu.bank.getInventoryList();

        list.empty();

        for (let i = 0; i < this.getInventorySize(); i++) {
            let item = $(inventoryList[i]).clone(),
                slot = item.find(`#bankInventorySlot${i}`);

            slot.on('click', (event) => this.select(event));

            list.append(item);
        }

        this.selectedItem.on('click', () => this.remove('item'));

        this.selectedShards.on('click', () => this.remove('shards'));
    }

    public add(type: string, index: number): void {
        let image = this.getSlot(index).find(`#inventoryImage${index}`);

        switch (type) {
            case 'item':
                this.selectedItem.css('background-image', image.css('background-image'));

                if (Detect.isMobile()) this.selectedItem.css('background-size', '600%');

                break;

            case 'shards': {
                this.selectedShards.css('background-image', image.css('background-image'));

                if (Detect.isMobile()) this.selectedShards.css('background-size', '600%');

                let { count } = this.getItemSlot(index);

                if (count > 1) this.shardsCount.text(count);

                break;
            }
        }

        image.css('background-image', '');

        this.getSlot(index).find(`#inventoryItemCount${index}`).text('');
    }

    public moveBack(type: string, index: number): void {
        let image = this.getSlot(index).find(`#inventoryImage${index}`),
            itemCount = this.getSlot(index).find(`#inventoryItemCount${index}`),
            { count } = this.getItemSlot(index);

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

    private enchant(): void {
        this.game.socket.send(Packets.Enchant, [Opcodes.Enchant.Enchant]);
    }

    private select(event: JQuery.ClickEvent): void {
        this.game.socket.send(Packets.Enchant, [
            Opcodes.Enchant.Select,
            event.currentTarget.id.slice(17)
        ]);
    }

    private remove(type: string): void {
        this.game.socket.send(Packets.Enchant, [Opcodes.Enchant.Remove, type]);
    }

    private getInventorySize(): number {
        return this.menu.inventory.getSize();
    }

    private getItemSlot(index: number): Slot {
        return this.menu.inventory.container.slots[index];
    }

    public display(): void {
        log.info('Yes hello, I am displaying');

        this.body.fadeIn('fast');
        this.load();
    }

    public hide(): void {
        this.remove('item');
        this.remove('shards');

        this.selectedItem.css('background-image', '');
        this.selectedShards.css('background-image', '');
        this.shardsCount.text('');

        this.body.fadeOut('fast');
    }

    public clear(): void {
        this.enchantSlots.find('ul').empty();

        this.confirm.off('click');
        this.closeEnchant.off('click');
    }

    // hasImage(image: JQuery): boolean {
    //     return image.css('background-image') !== 'none';
    // }

    private getSlot(index: number): JQuery<HTMLLIElement> {
        return $(this.getSlots().find('li')[index]);
    }

    private getSlots(): JQuery<HTMLUListElement> {
        return this.enchantSlots.find('ul');
    }

    public isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
