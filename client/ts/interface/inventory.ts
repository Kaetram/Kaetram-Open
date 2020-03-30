/* global log, Detect, Packets */

import $ from 'jquery';
import Container from './container/container';
import Packets from '../network/packets';
import Detect from '../utils/detect';

export default class Interface {
    game: any;
    actions: any;
    body: JQuery<HTMLElement>;
    button: JQuery<HTMLElement>;
    action: JQuery<HTMLElement>;
    container: Container;
    activeClass: string;
    selectedSlot: any;
    selectedItem: any;
    constructor(game, size) {
        this.game = game;
        this.actions = game.interface.actions;

        this.body = $('#inventory');
        this.button = $('#inventoryButton');
        this.action = $('#actionContainer');

        this.container = new Container(size);

        this.activeClass = 'inventory';

        this.selectedSlot = null;
        this.selectedItem = null;
    }

    load(data) {
        const list = $('#inventory').find('ul');

        for (let i = 0; i < data.length; i++) {
            const item = data[i];

            this.container.setSlot(i, item);

            const itemSlot = $(
                '<div id="slot' + i + '" class="itemSlot"></div>'
            );

            if (item.string !== 'null')
                itemSlot.css(
                    'background-image',
                    this.container.getImageFormat(this.getScale(), item.string)
                );

            itemSlot.css('background-size', '600%');

            itemSlot.dblclick((event) => {
                this.clickDouble(event);
            });

            itemSlot.click((event) => {
                this.click(event);
            });

            const itemSlotList = $('<li></li>');
            let count = item.count;

            if (count > 999999)
                count =
                    count.toString().substring(0, count.toString().length - 6) +
                    'M';
            else if (count > 9999)
                count = count.toString().substring(0, 2) + 'K';
            else if (count === 1) count = '';

            itemSlotList.append(itemSlot);
            itemSlotList.append(
                '<div id="itemCount' +
                    i +
                    '" class="inventoryItemCount">' +
                    count +
                    '</div>'
            );

            list.append(itemSlotList);
        }

        this.button.click(() => {
            this.open();
        });
    }

    open() {
        this.game.interface.hideAll();

        if (this.isVisible()) this.hide();
        else this.display();

        this.game.socket.send(Packets.Click, [
            'inventory',
            this.button.hasClass('active')
        ]);
    }

    click(event) {
        const index = event.currentTarget.id.substring(4);
        const slot = this.container.slots[index];
        const item = $(this.getList()[index]);

        this.clearSelection();

        if (slot.string === null || slot.count === -1 || slot.string === 'null')
            return;

        this.actions.reset();
        this.actions.loadDefaults('inventory');

        if (slot.edible)
            this.actions.add($('<div id="eat" class="actionButton">Eat</div>'));
        else if (slot.equippable)
            this.actions.add(
                $('<div id="wield" class="actionButton">Wield</div>')
            );
        else if (slot.count > 999999)
            this.actions.add(
                $('<div id="itemInfo" class="actionButton">Info</div>')
            );

        if (!this.actions.isVisible()) this.actions.show();

        const sSlot = item.find('#slot' + index);

        sSlot.addClass('select');

        this.selectedSlot = sSlot;
        this.selectedItem = slot;

        this.actions.hideDrop();
    }

    clickDouble(event) {
        const index = event.currentTarget.id.substring(4);
        const slot = this.container.slots[index];

        if (!slot.edible && !slot.equippable) return;

        const item = $(this.getList()[index]);
        const sSlot = item.find('#slot' + index);

        this.clearSelection();

        this.selectedSlot = sSlot;
        this.selectedItem = slot;

        this.clickAction(slot.edible ? 'eat' : 'wield');

        this.actions.hideDrop();
    }

    clickAction(event, dAction?) {
        const action = event.currentTarget ? event.currentTarget.id : event;

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

            case 'drop':
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

            case 'dropAccept':
                const count: any = $('#dropCount').val();

                if (isNaN(count) || count < 1) return;

                this.game.socket.send(Packets.Inventory, [
                    Packets.InventoryOpcode.Remove,
                    this.selectedItem,
                    count
                ]);
                this.actions.hideDrop();
                this.clearSelection();

                break;

            case 'dropCancel':
                this.actions.hideDrop();
                this.clearSelection();

                break;

            case 'itemInfo':
                this.game.input.chatHandler.add(
                    'WORLD',
                    'You have ' + this.selectedItem.count + ' coins.'
                );

                break;
        }

        this.actions.hide();
    }

    add(info) {
        const item = $(this.getList()[info.index]);
        const slot = this.container.slots[info.index];

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

        const cssSlot = item.find('#slot' + info.index);

        cssSlot.css(
            'background-image',
            this.container.getImageFormat(this.getScale(), slot.string)
        );

        cssSlot.css('background-size', '600%');

        let count = slot.count;

        if (count > 999999)
            count =
                count.toString().substring(0, count.toString().length - 6) +
                'M';
        else if (count > 9999) count = count.toString().substring(0, 2) + 'K';
        else if (count === 1) count = '';

        item.find('#itemCount' + info.index).text(count);
    }

    remove(info) {
        const item = $(this.getList()[info.index]);
        const slot = this.container.slots[info.index];

        if (!item || !slot) return;

        slot.count -= info.count;

        item.find('#itemCount' + info.index).text(slot.count);

        if (slot.count < 1) {
            item.find('#slot' + info.index).css('background-image', '');
            item.find('#itemCount' + info.index).text('');
            slot.empty();
        }
    }

    resize() {
        const list = this.getList();

        for (let i = 0; i < list.length; i++) {
            const item = $(list[i]).find('#slot' + i);
            const slot = this.container.slots[i];

            if (!slot) continue;

            if (Detect.isMobile()) item.css('background-size', '600%');
            else
                item.css(
                    'background-image',
                    this.container.getImageFormat(this.getScale(), slot.string)
                );
        }
    }

    clearSelection() {
        if (!this.selectedSlot) return;

        this.selectedSlot.removeClass('select');
        this.selectedSlot = null;
        this.selectedItem = null;
    }

    display() {
        this.body.fadeIn('fast');
        this.button.addClass('active');
    }

    hide(keepSelection?) {
        this.button.removeClass('active');

        this.body.fadeOut('slow');
        this.button.removeClass('active');

        if (!keepSelection) this.clearSelection();
    }

    clear() {
        $('#inventory')
            .find('ul')
            .empty();

        if (this.button) this.button.unbind('click');
    }

    getScale() {
        return this.game.renderer.getScale();
    }

    getSize() {
        return this.container.size;
    }

    getList() {
        return $('#inventory')
            .find('ul')
            .find('li');
    }

    isVisible() {
        return this.body.css('display') === 'block';
    }
};
