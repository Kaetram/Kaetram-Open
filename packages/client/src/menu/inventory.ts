import $ from 'jquery';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import * as Detect from '../utils/detect';
import Container from './container/container';

import type Game from '../game';
import type Slot from './container/slot';
import MenuController from '../controllers/menu';
import { SlotData } from '@kaetram/common/types/slot';

export default class Inventory {
    private actions;

    private body = $('#inventory');
    private button = $('#inventory-button');
    // private action = $('#action-container');

    public container: Container;

    private selectedSlot: JQuery | null = null;
    private selectedItem: Slot | null = null;

    public constructor(
        private game: Game,
        private menu: MenuController,
        public size: number,
        data: SlotData[]
    ) {
        this.actions = this.menu.actions;
        this.container = new Container(this.size);

        this.load(data);
    }

    public load(data: SlotData[]): void {
        let list = $('#inventory').find('ul');

        this.clear();

        for (let index = 0; index < this.size; index++) {
            // Create an empty item slot.
            let itemSlot = $(`<div id="slot${index}" class="item-slot"></div>`),
                itemSlotCount = $(
                    `<div id="item-count${index}" class="inventory-item-count"></div>`
                ),
                slotElement = $('<li></li>').append(itemSlot).append(itemSlotCount);

            itemSlot.dblclick((event) => this.clickDouble(event));

            itemSlot.on('click', (event) => this.click(event));

            list.append(slotElement);
        }

        this.button.on('click', () => this.open());

        if (data.length === 0) return;

        for (let slot of data) this.add(slot);
    }

    public add(info: SlotData): void {
        let item = $(this.getList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        // Have the server forcefully load data into the slot.
        slot.load(
            info.key,
            info.count,
            info.ability,
            info.abilityLevel,
            info.edible,
            info.equippable
        );

        let cssSlot = item.find(`#slot${info.index}`);

        cssSlot.css('background-image', this.container.getImageFormat(slot.key));

        cssSlot.css('background-size', '600%');

        let { count, ability } = slot,
            itemCount = count.toString();

        if (count > 999_999)
            itemCount = `${itemCount.slice(0, Math.max(0, itemCount.length - 6))}M`;
        else if (count > 9999) itemCount = `${itemCount.slice(0, 2)}K`;
        else if (count < 2) itemCount = '';

        item.find(`#item-count${info.index}`).text(itemCount);

        if (ability! > -1) {
            let eList = Object.keys(Modules.Enchantment), // enchantment list
                enchantment = eList[ability!];

            if (enchantment) item.find(`#item-count${info.index}`).text(enchantment);
        }
    }

    public open(): void {
        this.menu.hideAll();

        if (this.isVisible()) this.hide();
        else this.display();

        this.game.socket.send(Packets.Click, ['inventory', this.button.hasClass('active')]);
    }

    private click(event: JQuery.ClickEvent): void {
        let index = event.currentTarget.id.slice(4),
            slot = this.container.slots[index],
            item = $(this.getList()[index]);

        this.clearSelection();

        if (slot.key === null || slot.count === -1 || slot.key === 'null') return;

        this.actions.loadDefaults('inventory');

        if (slot.edible) this.actions.add($('<div id="eat" class="action-button">Eat</div>'));
        else if (slot.equippable)
            this.actions.add($('<div id="wield" class="action-button">Wield</div>'));
        else if (slot.count > 999_999)
            this.actions.add($('<div id="itemInfo" class="action-button">Info</div>'));

        if (!this.actions.isVisible()) this.actions.show();

        let sSlot = item.find(`#slot${index}`);

        sSlot.addClass('select');

        this.selectedSlot = sSlot;
        this.selectedItem = slot;

        this.actions.hideDrop();
    }

    private clickDouble(event: JQuery.DoubleClickEvent): void {
        let index = event.currentTarget.id.slice(4),
            slot = this.container.slots[index];

        if (!slot.edible && !slot.equippable) return;

        let item = $(this.getList()[index]),
            sSlot = item.find(`#slot${index}`);

        this.clearSelection();

        this.selectedSlot = sSlot;
        this.selectedItem = slot;

        this.clickAction(slot.edible ? 'eat' : 'wield');

        this.actions.hideDrop();
    }

    public clickAction(event: string | JQuery.ClickEvent): void {
        let action = (event as JQuery.ClickEvent).currentTarget?.id || event;

        if (!this.selectedSlot || !this.selectedItem) return;

        switch (action) {
            case 'eat':
            case 'wield':
                this.game.socket.send(Packets.Container, [
                    Modules.ContainerType.Inventory,
                    Opcodes.Container.Select,
                    this.selectedItem.index
                ]);
                this.clearSelection();

                break;

            case 'drop':
                if (this.selectedItem.count > 1) {
                    if (Detect.isMobile()) this.hide(true);

                    this.actions.displayDrop('inventory');
                } else {
                    this.game.socket.send(Packets.Container, [
                        Modules.ContainerType.Inventory,
                        Opcodes.Container.Drop,
                        this.selectedItem.index
                    ]);
                    this.clearSelection();
                }

                break;

            case 'drop-accept': {
                let count = parseInt($('#drop-count').val() as string);

                if (isNaN(count) || count < 1) return;

                this.game.socket.send(Packets.Container, [
                    Modules.ContainerType.Inventory,
                    Opcodes.Container.Drop,
                    this.selectedItem.index,
                    count
                ]);
                this.actions.hideDrop();
                this.clearSelection();

                break;
            }

            case 'drop-cancel':
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

    public remove(info: SlotData): void {
        let { index, count } = info,
            item = $(this.getList()[index]),
            slot = this.container.slots[index];

        if (!item || !slot) return;

        slot.count = count;
        let itemCount = slot.count.toString();

        if (slot.count === 1) itemCount = '';

        item.find(`#item-count${index}`).text(itemCount);

        if (slot.count < 1) {
            item.find(`#slot${index}`).css('background-image', '');
            item.find(`#item-count${index}`).text('');
            slot.empty();
        }
    }

    public resize(): void {
        let list = this.getList();

        for (let [i, element] of [...list].entries()) {
            let item = $(element).find(`#slot${i}`),
                slot = this.container.slots[i];

            if (!slot) continue;

            if (Detect.isMobile()) item.css('background-size', '600%');
            else item.css('background-image', this.container.getImageFormat(slot.key));
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

    public hide(keepSelection = false): void {
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
