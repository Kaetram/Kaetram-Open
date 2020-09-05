import $ from 'jquery';

import Equipment from '../entity/character/player/equipment/equipment';
import Game from '../game';
import Packets from '../network/packets';
import * as Detect from '../utils/detect';
import Modules from '../utils/modules';
import Actions from './actions';
import Container from './container/container';
import Slot from './container/slot';

export default class Inventory {
    game: Game;
    actions: Actions;
    body: JQuery;
    button: JQuery<HTMLButtonElement>;
    action: JQuery<HTMLDivElement>;
    container: Container;
    activeClass: string;
    selectedSlot: JQuery;
    selectedItem: Slot;

    constructor(game: Game, size: number) {
        this.game = game;
        this.actions = game.menu.actions;

        this.body = $('#inventory');
        this.button = $('#inventoryButton');
        this.action = $('#actionContainer');

        this.container = new Container(size);

        this.activeClass = 'inventory';

        this.selectedSlot = null;
        this.selectedItem = null;
    }

    async load(data: Equipment[]): Promise<void> {
        const list = $('#inventory').find('ul');

        for (let i = 0; i < data.length; i++) {
            const item = data[i];

            this.container.setSlot(i, item);

            const itemSlot = $(`<div id="slot${i}" class="itemSlot"></div>`);

            if (item.string !== 'null')
                itemSlot.css('background-image', await this.container.getImageFormat(item.string));

            itemSlot.css('background-size', '600%');

            itemSlot.dblclick((event) => {
                this.clickDouble(event);
            });

            itemSlot.click((event) => {
                this.click(event);
            });

            const itemSlotList = $('<li></li>');
            const count = item.count;
            let itemCount = '';

            if (count > 999999)
                itemCount = `${count.toString().substring(0, count.toString().length - 6)}M`;
            else if (count > 9999) itemCount = `${count.toString().substring(0, 2)}K`;
            else if (count === 1) itemCount = '';

            itemSlotList.append(itemSlot);
            itemSlotList.append(
                `<div id="itemCount${i}" class="inventoryItemCount">${itemCount}</div>`
            );

            if (item.ability > -1) {
                const eList = Object.keys(Modules.Enchantment), // enchantment list
                    enchantment = eList[item.ability];

                if (enchantment) itemSlotList.find(`#itemCount${i}`).text(enchantment);
            }

            list.append(itemSlotList);
        }

        this.button.click(() => {
            this.open();
        });
    }

    open(): void {
        this.game.menu.hideAll();

        if (this.isVisible()) this.hide();
        else this.display();

        this.game.socket.send(Packets.Click, ['inventory', this.button.hasClass('active')]);
    }

    click(event: JQuery.ClickEvent): void {
        const index = event.currentTarget.id.substring(4),
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

    clickDouble(event: JQuery.DoubleClickEvent): void {
        const index = event.currentTarget.id.substring(4),
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

    clickAction(event: string | JQuery.ClickEvent): void {
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

    async add(info: Slot): Promise<void> {
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

        cssSlot.css('background-image', await this.container.getImageFormat(slot.string));

        cssSlot.css('background-size', '600%');

        const count = slot.count;
        let itemCount = '';

        if (count > 999999)
            itemCount = `${count.toString().substring(0, count.toString().length - 6)}M`;
        else if (count > 9999) itemCount = `${count.toString().substring(0, 2)}K`;
        else if (count === 1) itemCount = '';

        item.find(`#itemCount${info.index}`).text(itemCount);

        if (slot.ability > -1) {
            const eList = Object.keys(Modules.Enchantment), // enchantment list
                enchantment = eList[slot.ability];

            if (enchantment) item.find(`#itemCount${info.index}`).text(enchantment);
        }
    }

    remove(info: Slot): void {
        const item = $(this.getList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        slot.count -= info.count;

        item.find(`#itemCount${info.index}`).text(slot.count);

        if (slot.count < 1) {
            item.find(`#slot${info.index}`).css('background-image', '');
            item.find(`#itemCount${info.index}`).text('');
            slot.empty();
        }
    }

    async resize(): Promise<void> {
        const list = this.getList();

        for (let i = 0; i < list.length; i++) {
            const item = $(list[i]).find(`#slot${i}`),
                slot = this.container.slots[i];

            if (!slot) continue;

            if (Detect.isMobile()) item.css('background-size', '600%');
            else item.css('background-image', await this.container.getImageFormat(slot.string));
        }
    }

    clearSelection(): void {
        if (!this.selectedSlot) return;

        this.selectedSlot.removeClass('select');
        this.selectedSlot = null;
        this.selectedItem = null;
    }

    display(): void {
        this.body.fadeIn('fast');
        this.button.addClass('active');
    }

    hide(keepSelection?: boolean): void {
        this.button.removeClass('active');

        this.body.fadeOut('slow');
        this.button.removeClass('active');

        if (!keepSelection) this.clearSelection();
    }

    clear(): void {
        $('#inventory').find('ul').empty();

        if (this.button) this.button.off('click');
    }

    getScale(): number {
        return this.game.renderer.getScale();
    }

    getSize(): number {
        return this.container.size;
    }

    getList(): JQuery {
        return $('#inventory').find('ul').find('li');
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
