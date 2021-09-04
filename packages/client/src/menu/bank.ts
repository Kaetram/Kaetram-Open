import $ from 'jquery';

import { Opcodes, Packets } from '@kaetram/common/network';

import Container from './container/container';

import type { ContainerAddData, ContainerRemoveData } from '@kaetram/common/types/messages';
import type Game from '../game';
import type Slot from './container/slot';

export default class Bank {
    // player = this.game.player;

    private body = $('#bank');
    private bankSlots = $('#bankSlots');
    private bankInventorySlots = $('#bankInventorySlots');

    private container: Container;
    private close = $('#closeBank');

    private scale!: number;

    public constructor(
        private game: Game,
        private inventoryContainer: Container,
        size: number,
        data: Slot[]
    ) {
        this.container = new Container(size);

        this.close.css('left', '97%');
        this.close.on('click', () => this.hide());

        this.load(data);
    }

    private load(data: Slot[]): void {
        let bankList = this.bankSlots.find('ul'),
            inventoryList = this.bankInventorySlots.find('ul');

        for (let [i, item] of data.entries()) {
            let slot = $(`<div id="bankSlot${i}" class="bankSlot"></div>`);

            this.container.setSlot(i, item);

            slot.css({
                marginRight: `${2 * this.getScale()}px`,
                marginBottom: `${4 * this.getScale()}px`
            });

            let image = $(`<div id="bankImage${i}" class="bankImage"></div>`);

            if (item.string)
                image.css('background-image', this.container.getImageFormat(item.string));

            slot.on('click', (event) => this.click('bank', event));

            let { count } = item,
                itemCount: string = count.toString();

            if (count > 999_999)
                itemCount = `${count
                    .toString()
                    .slice(0, Math.max(0, count.toString().length - 6))}M`;
            else if (count > 9999) itemCount = `${count.toString().slice(0, 2)}K`;
            else if (count === 1) itemCount = '';

            slot.append(image);
            slot.append(`<div id="bankItemCount${i}" class="itemCount">${itemCount}</div>`);

            slot.find(`#bankItemCount${i}`).css({
                fontSize: `${4 * this.getScale()}px`,
                marginTop: '0',
                marginLeft: '0'
            });

            let bankListItem = $('<li></li>');

            bankListItem.append(slot);

            bankList.append(bankListItem);
        }

        for (let j = 0; j < this.inventoryContainer.size; j++) {
            let iItem = this.inventoryContainer.slots[j],
                iSlot = $(`<div id="bankInventorySlot${j}" class="bankSlot"></div>`);

            iSlot.css({
                marginRight: `${3 * this.getScale()}px`,
                marginBottom: `${6 * this.getScale()}px`
            });

            let slotImage = $(`<div id="inventoryImage${j}" class="bankImage"></div>`);

            if (iItem.string)
                slotImage.css('background-image', this.container.getImageFormat(iItem.string));

            iSlot.on('click', (event) => this.click('inventory', event));

            let { count } = iItem,
                itemCount = count.toString();

            if (count > 999_999)
                itemCount = `${count
                    .toString()
                    .slice(0, Math.max(0, count.toString().length - 6))}M`;
            else if (count > 9999) itemCount = `${count.toString().slice(0, 2)}K`;
            else if (count === 1) itemCount = '';

            iSlot.append(slotImage);
            iSlot.append(`<div id="inventoryItemCount${j}" class="itemCount">${itemCount}</div>`);

            iSlot.find(`#inventoryItemCount${j}`).css({
                marginTop: '0',
                marginLeft: '0'
            });

            let inventoryListItem = $('<li></li>');

            inventoryListItem.append(iSlot);

            inventoryList.append(inventoryListItem);
        }
    }

    public resize(): void {
        let bankList = this.getBankList(),
            inventoryList = this.getInventoryList();

        for (let [i, element] of [...bankList].entries()) {
            let bankSlot = $(element).find(`#bankSlot${i}`),
                image = bankSlot.find(`#bankImage${i}`),
                slot = this.container.slots[i];

            bankSlot.css({
                marginRight: `${2 * this.getScale()}px`,
                marginBottom: `${4 * this.getScale()}px`
            });

            bankSlot.find(`#bankItemCount${i}`).css({
                fontSize: `${4 * this.getScale()}px`,
                marginTop: '0',
                marginLeft: '0'
            });

            image.css('background-image', this.container.getImageFormat(slot.string));
        }

        for (let [j, element] of [...inventoryList].entries()) {
            let inventorySlot = $(element).find(`#bankInventorySlot${j}`),
                iImage = inventorySlot.find(`#inventoryImage${j}`),
                iSlot = this.inventoryContainer.slots[j];

            inventorySlot.css({
                marginRight: `${3 * this.getScale()}px`,
                marginBottom: `${6 * this.getScale()}px`
            });

            iImage.css('background-image', this.container.getImageFormat(iSlot.string));
        }
    }

    private click(type: string, event: JQuery.ClickEvent): void {
        let isBank = type === 'bank',
            index = event.currentTarget.id.slice(Math.max(0, isBank ? 8 : 17));

        this.game.socket.send(Packets.Bank, [Opcodes.Bank.Select, type, index]);
    }

    public add(info: ContainerAddData): void {
        let item = $(this.getBankList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        if (slot.isEmpty()) slot.load(info.string, info.count, info.ability, info.abilityLevel);

        slot.setCount(info.count);

        let bankSlot = item.find(`#bankSlot${info.index}`),
            cssSlot = bankSlot.find(`#bankImage${info.index}`),
            count = bankSlot.find(`#bankItemCount${info.index}`);

        cssSlot.css('background-image', this.container.getImageFormat(info.string));

        if (this.scale < 3) cssSlot.css('background-size', '600%');

        if (slot.count > 1) count.text(slot.count);
    }

    public remove(info: ContainerRemoveData): void {
        let item = $(this.getBankList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        let divItem = item.find(`#bankSlot${info.index}`);

        slot.count -= info.count;

        if (slot.count < 1) {
            divItem.find(`#bankImage${info.index}`).css('background-image', '');
            divItem.find(`#bankItemCount${info.index}`).text('');

            slot.empty();
        } else divItem.find(`#bankItemCount${info.index}`).text(slot.count);
    }

    public addInventory(info: Slot): void {
        let item = $(this.getInventoryList()[info.index]);

        if (!item) return;

        let slot = item.find(`#bankInventorySlot${info.index}`),
            image = slot.find(`#inventoryImage${info.index}`);

        image.css('background-image', this.container.getImageFormat(info.string));

        if (info.count > 1) slot.find(`#inventoryItemCount${info.index}`).text(info.count);
    }

    public removeInventory(info: Slot): void {
        let item = $(this.getInventoryList()[info.index]);

        if (!item) return;

        /**
         * All we're doing here is subtracting and updating the count
         * of the items in the inventory first.
         */

        let itemContainer = this.inventoryContainer.slots[info.index],
            slot = item.find(`#bankInventorySlot${info.index}`),
            diff = itemContainer.count - info.count;

        if (diff > 1) slot.find(`#inventoryItemCount${info.index}`).text(diff);
        else if (diff === 1) slot.find(`#inventoryItemCount${info.index}`).text('');
        else {
            slot.find(`#inventoryImage${info.index}`).css('background-image', '');
            slot.find(`#inventoryItemCount${info.index}`).text('');
        }
    }

    public display(): void {
        this.body.fadeIn('slow');
    }

    public hide(): void {
        this.body.fadeOut('fast');
    }

    public clear(): void {
        this.bankSlots?.find('ul').empty();

        this.bankInventorySlots?.find('ul').empty();
    }

    public isVisible(): boolean {
        return this.body.css('display') === 'block';
    }

    private getScale(): number {
        return this.game.app.getUIScale();
    }

    private getBankList(): JQuery<HTMLLIElement> {
        return this.bankSlots.find('ul').find('li');
    }

    public getInventoryList(): JQuery<HTMLLIElement> {
        return this.bankInventorySlots.find('ul').find('li');
    }
}
