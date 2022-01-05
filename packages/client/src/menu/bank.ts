import $ from 'jquery';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import Container from './container/container';

import type Game from '../game';
import type Slot from './container/slot';
import { SlotData } from '@kaetram/common/types/slot';
import MenuController from '../controllers/menu';

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
        private menu: MenuController,
        private size: number,
        data: SlotData[]
    ) {
        this.container = new Container(size);

        this.close.css('left', '97%');
        this.close.on('click', () => this.hide());

        this.load(data);
    }

    public load(data: SlotData[]): void {
        let bankList = this.bankSlots.find('ul'),
            inventoryList = this.bankInventorySlots.find('ul');

        this.clear();

        for (let i = 0; i < this.size; i++) {
            let bankSlot = $(`<div id="bankSlot${i}" class="bankSlot"></div>`),
                bankCount = $(`<div id="bankItemCount${i}" class="itemCount"></div>`),
                slotImage = $(`<div id="bankImage${i}" class="bankImage"></div>`),
                slotElement = $('<li></li>').append(bankSlot.append(slotImage)).append(bankCount);

            bankSlot.on('click', (event) => this.click('bank', event));

            bankSlot.css({
                marginRight: `${2 * this.getScale()}px`,
                marginBottom: `${4 * this.getScale()}px`
            });

            bankList.append(slotElement);
        }

        let inventorySize = this.menu.getInventorySize();

        for (let j = 0; j < inventorySize; j++) {
            let inventorySlot = $(`<div id="bankInventorySlot${j}" class="bankSlot"></div>`),
                inventoryCount = $(`<div id="inventoryItemCount${j}" class="itemCount"></div>`),
                slotImage = $(`<div id="inventoryImage${j}" class="bankImage"></div>`),
                slotElement = $('<li></li>')
                    .append(inventorySlot.append(slotImage))
                    .append(inventoryCount);

            inventorySlot.on('click', (event) => this.click('inventory', event));

            inventorySlot.css({
                marginRight: `${3 * this.getScale()}px`,
                marginBottom: `${6 * this.getScale()}px`
            });

            inventoryList.append(slotElement);
        }

        for (let item of data) this.add(item);

        for (let inventoryItem of this.menu.getInventoryData()) this.addInventory(inventoryItem);

        // for (let [i, item] of data.entries()) {
        //     let slot = $(`<div id="bankSlot${i}" class="bankSlot"></div>`);
        //     this.container.setSlot(i, item);
        //     slot.css({
        //         marginRight: `${2 * this.getScale()}px`,
        //         marginBottom: `${4 * this.getScale()}px`
        //     });
        //     let image = $(`<div id="bankImage${i}" class="bankImage"></div>`);
        //     if (item.key) image.css('background-image', this.container.getImageFormat(item.key));
        //     slot.on('click', (event) => this.click('bank', event));
        //     let { count } = item,
        //         itemCount: string = count.toString();
        //     if (count > 999_999)
        //         itemCount = `${count
        //             .toString()
        //             .slice(0, Math.max(0, count.toString().length - 6))}M`;
        //     else if (count > 9999) itemCount = `${count.toString().slice(0, 2)}K`;
        //     else if (count === 1) itemCount = '';
        //     slot.append(image);
        //     slot.append(`<div id="bankItemCount${i}" class="itemCount">${itemCount}</div>`);
        //     slot.find(`#bankItemCount${i}`).css({
        //         fontSize: `${4 * this.getScale()}px`,
        //         marginTop: '0',
        //         marginLeft: '0'
        //     });
        //     let bankListItem = $('<li></li>');
        //     bankListItem.append(slot);
        //     bankList.append(bankListItem);
        // }
        // for (let j = 0; j < this.inventoryContainer.size; j++) {
        //     let iItem = this.inventoryContainer.slots[j],
        //         iSlot = $(`<div id="bankInventorySlot${j}" class="bankSlot"></div>`);
        //     iSlot.css({
        //         marginRight: `${3 * this.getScale()}px`,
        //         marginBottom: `${6 * this.getScale()}px`
        //     });
        //     let slotImage = $(`<div id="inventoryImage${j}" class="bankImage"></div>`);
        //     if (iItem.key)
        //         slotImage.css('background-image', this.container.getImageFormat(iItem.key));
        //     iSlot.on('click', (event) => this.click('inventory', event));
        //     let { count } = iItem,
        //         itemCount = count.toString();
        //     if (count > 999_999)
        //         itemCount = `${count
        //             .toString()
        //             .slice(0, Math.max(0, count.toString().length - 6))}M`;
        //     else if (count > 9999) itemCount = `${count.toString().slice(0, 2)}K`;
        //     else if (count === 1) itemCount = '';
        //     iSlot.append(slotImage);
        //     iSlot.append(`<div id="inventoryItemCount${j}" class="itemCount">${itemCount}</div>`);
        //     iSlot.find(`#inventoryItemCount${j}`).css({
        //         marginTop: '0',
        //         marginLeft: '0'
        //     });
        //     let inventoryListItem = $('<li></li>');
        //     inventoryListItem.append(iSlot);
        //     inventoryList.append(inventoryListItem);
        // }
    }

    public resize(): void {
        // let bankList = this.getBankList(),
        //     inventoryList = this.getInventoryList();
        // for (let [i, element] of [...bankList].entries()) {
        //     let bankSlot = $(element).find(`#bankSlot${i}`),
        //         image = bankSlot.find(`#bankImage${i}`),
        //         slot = this.container.slots[i];
        //     bankSlot.css({
        //         marginRight: `${2 * this.getScale()}px`,
        //         marginBottom: `${4 * this.getScale()}px`
        //     });
        //     bankSlot.find(`#bankItemCount${i}`).css({
        //         fontSize: `${4 * this.getScale()}px`,
        //         marginTop: '0',
        //         marginLeft: '0'
        //     });
        //     image.css('background-image', this.container.getImageFormat(slot.key));
        // }
        // for (let [j, element] of [...inventoryList].entries()) {
        //     let inventorySlot = $(element).find(`#bankInventorySlot${j}`),
        //         iImage = inventorySlot.find(`#inventoryImage${j}`),
        //         iSlot = this.inventoryContainer.slots[j];
        //     inventorySlot.css({
        //         marginRight: `${3 * this.getScale()}px`,
        //         marginBottom: `${6 * this.getScale()}px`
        //     });
        //     iImage.css('background-image', this.container.getImageFormat(iSlot.key));
        // }
    }

    private click(type: string, event: JQuery.ClickEvent): void {
        let splitElement = type === 'bank' ? 'bankSlot' : 'bankInventorySlot',
            index = parseInt(event.currentTarget.id.split(splitElement)[1]);

        this.game.socket.send(Packets.Container, [
            Modules.ContainerType.Bank,
            Opcodes.Container.Select,
            index,
            type
        ]);
    }

    public add(info: SlotData): void {
        let item = $(this.getBankList()[info.index]),
            slot = this.container.slots[info.index];

        if (!item || !slot) return;

        if (slot.isEmpty()) slot.load(info.key, info.count, info.ability, info.abilityLevel);

        slot.setCount(info.count);

        let bankSlot = item.find(`#bankSlot${info.index}`),
            cssSlot = bankSlot.find(`#bankImage${info.index}`),
            count = bankSlot.find(`#bankItemCount${info.index}`);

        cssSlot.css('background-image', this.container.getImageFormat(info.key));

        if (this.scale < 3) cssSlot.css('background-size', '600%');

        if (slot.count > 1) count.text(slot.count);
    }

    public remove(info: SlotData): void {
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

        image.css('background-image', this.container.getImageFormat(info.key));

        if (info.count > 1) slot.find(`#inventoryItemCount${info.index}`).text(info.count);
    }

    public removeInventory(info: Slot): void {
        let item = $(this.getInventoryList()[info.index]);
        if (!item) return;
        /**
         * All we're doing here is subtracting and updating the count
         * of the items in the inventory first.
         */
        // let itemContainer = this.inventoryContainer.slots[info.index],
        //     slot = item.find(`#bankInventorySlot${info.index}`),
        //     diff = itemContainer.count - info.count;
        // if (diff > 1) slot.find(`#inventoryItemCount${info.index}`).text(diff);
        // else if (diff === 1) slot.find(`#inventoryItemCount${info.index}`).text('');
        // else {
        //     slot.find(`#inventoryImage${info.index}`).css('background-image', '');
        //     slot.find(`#inventoryItemCount${info.index}`).text('');
        // }
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
