import $ from 'jquery';

import * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import * as Detect from '../utils/detect';
import Container from './container/container';

import type Equipment from '../entity/character/player/equipment/equipment';
import type Game from '../game';
import type Slot from './container/slot';

export default class Inventory {
    private actions;

    private body = $('#inventory');
    private button = $('#inventoryButton');
    // private action = $('#actionContainer');

    public container: Container;

    private selectedSlot: JQuery | null = null;
    private selectedItem: Slot | null = null;

    public constructor(private game: Game, size: number, data: Equipment[]) {
        this.actions = game.menu.actions;
        this.container = new Container(size);

        this.load(data);
    }

    private load(data: Equipment[]): void {
        const list = $('#inventory').find('ul');

        for (const [i, item] of data.entries()) {
            this.container.setSlot(i, item);

            const itemSlot = $(`<div id="slot${i}" class="itemSlot"></div>`);

            if (item.string !== 'null')
                itemSlot.css('background-image', this.container.getImageFormat(item.string));

            itemSlot.css('background-size', '600%');

            itemSlot.dblclick((event) => this.clickDouble(event));

            itemSlot.on('click', (event) => this.click(event));

            const itemSlotList = $('<li></li>'),
                { count, ability } = item;
            let itemCount = count.toString();

            if (count > 999999)
                itemCount = `${itemCount.slice(0, Math.max(0, itemCount.length - 6))}M`;
            else if (count > 9999) itemCount = `${itemCount.slice(0, 2)}K`;
            else if (count === 1) itemCount = '';

            itemSlotList.append(itemSlot);
            itemSlotList.append(
                `<div id="itemCount${i}" class="inventoryItemCount">${itemCount}</div>`
            );

            if (ability > -1) {
                const eList = Object.keys(Modules.Enchantment), // enchantment list
                    enchantment = eList[ability];

                if (enchantment) itemSlotList.find(`#itemCount${i}`).text(enchantment);
            }

            list.append(itemSlotList);
        }

        this.button.on('click', () => this.open());
    }

    public open(): void {
        this.game.menu.hideAll();

        if (this.isVisible()) this.hide();
        else this.display();

        this.game.socket.send(Packets.Click, ['inventory', this.button.hasClass('active')]);
    }

    private click(event: JQuery.ClickEvent): void {
        const index = event.currentTarget.id.slice(4),
            slot = this.container.slots[index],
            item = $(this.getList()[index]);

        this.clearSelection();

        if (slot.string === null || slot.count === -1 || slot.string === 'null') return;

        this.actions.loadDefaults('inventory');

        if (slot.edible) this.actions.add($('<div id="eat" class="actionButton">Eat</div>'));
        else if (slot.equippable)
            this.actions.add($('<div id="wield" class="actionButton">Wield</div>'));
        else if (slot.count > 999999)
            this.actions.add($('<div id="itemInfo" class="actionButton">Info</div>'));

        if (!this.actions.isVisible()) this.actions.show();

        const sSlot = item.find(`#slot${index}`);

        sSlot.addClass('select');

        this.selectedSlot = sSlot;
        this.selectedItem = slot;

        this.actions.hideDrop();
    }

    private clickDouble(event: JQuery.DoubleClickEvent): void {
        const index = event.currentTarget.id.slice(4),
            slot = this.container.slots[index];

        if (!slot.edible && !slot.equippable) return;

        const item = $(this.getList()[index]),
            sSlot = item.find(`#slot${index}`);

        this.clearSelection();

        this.selectedSlot = sSlot;
        this.selectedItem = slot;

        this.clickAction(slot.edible ? 'eat' : 'wield');

        this.actions.hideDrop();
    }

    public clickAction(event: string | JQuery.ClickEvent): void {
        const action = (event as JQuery.ClickEvent).currentTarget?.id || event;

        if (!this.selectedSlot || !this.selectedItem) return;

        switch (action) {
            case 'eat':
            case 'wield':
                this.game.socket.send(Packets.Inventory, [
                    Packets.InventoryOpcode.Select,
                    this.selectedItem.index
                ]);
                this.clearSelection();

                break;

            case 'drop': {
                const item = this.selectedItem;

                if (item.count > 1) {
                    if (Detect.isMobile()) this.hide(true);

                    this.actions.displayDrop('inventory');
                } else {
                    this.game.socket.send(Packets.Inventory, [
                        Packets.InventoryOpcode.Remove,
                        item
                    ]);
                    this.clearSelection();
                }

                break;
            }

            case 'dropAccept': {
                const count = parseInt($('#dropCount').val() as string);

                if (isNaN(count) || count < 1) return;

                this.game.socket.send(Packets.Inventory, [
                    Packets.InventoryOpcode.Remove,
                    this.selectedItem,
                    count
                ]);
                this.actions.hideDrop();
                this.clearSelection();

                break;
            }

            case 'dropCancel':
                this.actions.hideDrop();
                this.clearSelection();

                break;

            case 'itemInfo': {
                this.game.input.chatHandler.add(
                    'WORLD',
                    `You have ${this.selectedItem.count} coins.`
                );

                break;
            }
        }

        this.actions.hide();
    }

    public add(info: Slot): void {
        const item = $(this.getList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        // Have the server forcefully load data into the slot.
        slot.load(
            info.string,
            info.count,
            info.ability,
            info.abilityLevel,
            info.edible,
            info.equippable
        );

        const cssSlot = item.find(`#slot${info.index}`);

        cssSlot.css('background-image', this.container.getImageFormat(slot.string));

        cssSlot.css('background-size', '600%');

        const { count, ability } = slot;
        let itemCount = count.toString();

        if (count > 999999) itemCount = `${itemCount.slice(0, Math.max(0, itemCount.length - 6))}M`;
        else if (count > 9999) itemCount = `${itemCount.slice(0, 2)}K`;
        else if (count === 1) itemCount = '';

        item.find(`#itemCount${info.index}`).text(itemCount);

        if (ability! > -1) {
            const eList = Object.keys(Modules.Enchantment), // enchantment list
                enchantment = eList[ability!];

            if (enchantment) item.find(`#itemCount${info.index}`).text(enchantment);
        }
    }

    public remove(info: Slot): void {
        const item = $(this.getList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        slot.count -= info.count;
        let itemCount = slot.count.toString();

        if (slot.count === 1) itemCount = '';

        item.find(`#itemCount${info.index}`).text(itemCount);

        if (slot.count < 1) {
            item.find(`#slot${info.index}`).css('background-image', '');
            item.find(`#itemCount${info.index}`).text('');
            slot.empty();
        }
    }

    public resize(): void {
        const list = this.getList();

        for (const [i, element] of [...list].entries()) {
            const item = $(element).find(`#slot${i}`),
                slot = this.container.slots[i];

            if (!slot) continue;

            if (Detect.isMobile()) item.css('background-size', '600%');
            else item.css('background-image', this.container.getImageFormat(slot.string));
        }
    }

    private clearSelection(): void {
        if (!this.selectedSlot) return;

        this.selectedSlot.removeClass('select');
        this.selectedSlot = null;
        this.selectedItem = null;
    }

    private display(): void {
        this.body.fadeIn('fast');
        this.button.addClass('active');
    }

    public hide(keepSelection?: boolean): void {
        this.button.removeClass('active');

        this.body.fadeOut('slow');
        this.button.removeClass('active');

        if (!keepSelection) this.clearSelection();
    }

    public clear(): void {
        $('#inventory').find('ul').empty();

        this.button?.off('click');
    }

    // getScale(): number {
    //     return this.game.renderer.getScale();
    // }

    public getSize(): number {
        return this.container.size;
    }

    private getList(): JQuery {
        return $('#inventory').find('ul').find('li');
    }

    public isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
