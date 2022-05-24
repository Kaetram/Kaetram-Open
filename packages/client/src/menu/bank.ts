import Menu from './menu';

export default class Bank extends Menu {
    private body: HTMLElement = document.querySelector('#bank')!;
    private slot: HTMLElement = document.querySelector('#bank-slot')!;
    private inventorySlots: HTMLElement = document.querySelector('#bank-inventory-slots')!;

    private close: HTMLElement = document.querySelector('#close-bank')!;

    public constructor() {
        super();

        this.close.addEventListener('click', () => this.hide());
    }

    public load(): void {
        //
    }

    /**
     * Displays the bank interface.
     */

    public override show(): void {
        this.body.style.display = 'block';
    }

    /**
     * Sets the body's display style to `none` and
     * clears all the items from the bank user interface.
     */

    public override hide(): void {
        this.body.style.display = 'none';
    }
}

// import $ from 'jquery';

// import { Modules, Packets, Opcodes } from '@kaetram/common/network';

// import Container from './container/container';

// import type Game from '../game';
// import type Slot from './container/slot';
// import { SlotData } from '@kaetram/common/types/slot';
// import MenuController from '../controllers/menu';

// import Utils from '../utils/util';

// export default class Bank {
//     // player = this.game.player;

//     private body = $('#bank');
//     private bankSlot = $('#bank-slot');
//     private bankInventorySlots = $('#bank-inventory-slots');

//     private container: Container;
//     private close = $('#close-bank');

//     private scale!: number;

//     public constructor(
//         private game: Game,
//         private menu: MenuController,
//         private size: number,
//         data: SlotData[] = []
//     ) {
//         this.container = new Container(size);

//         this.close.css('left', '97%');
//         this.close.on('click', () => this.hide());

//         this.load(data);
//     }

//     public load(data: SlotData[]): void {
//         let bankList = this.bankSlot.find('ul'),
//             inventoryList = this.bankInventorySlots.find('ul');

//         this.clear();

//         for (let i = 0; i < this.size; i++) {
//             let bankSlot = $(`<div id="bank-slot${i}" class="bank-slot"></div>`),
//                 bankCount = $(`<div id="bankItemCount${i}" class="item-count"></div>`),
//                 slotImage = $(`<div id="bank-image${i}" class="bank-image"></div>`),
//                 slotElement = $('<li></li>').append(bankSlot.append(slotImage).append(bankCount));

//             bankSlot.on('click', (event) => this.click('bank', event));

//             bankSlot.css({
//                 marginRight: `${2 * this.getScale()}px`,
//                 marginBottom: `${4 * this.getScale()}px`
//             });

//             bankCount.css('margin-top', 0);

//             bankList.append(slotElement);
//         }

//         let inventorySize = this.menu.getInventorySize();

//         for (let j = 0; j < inventorySize; j++) {
//             let inventorySlot = $(`<div id="bankInventorySlot${j}" class="bank-slot"></div>`),
//                 inventoryCount = $(`<div id="inventory-item-count${j}" class="item-count"></div>`),
//                 slotImage = $(`<div id="inventoryImage${j}" class="bank-image"></div>`),
//                 slotElement = $('<li></li>').append(
//                     inventorySlot.append(slotImage).append(inventoryCount)
//                 );

//             inventorySlot.on('click', (event) => this.click('inventory', event));

//             inventorySlot.css({
//                 marginRight: `${3 * this.getScale()}px`,
//                 marginBottom: `${6 * this.getScale()}px`
//             });

//             inventoryCount.css('margin-top', '0');

//             inventoryList.append(slotElement);
//         }

//         for (let item of data) this.add(item, Modules.ContainerType.Bank);

//         for (let inventoryItem of this.menu.getInventoryData())
//             this.add(inventoryItem, Modules.ContainerType.Inventory);
//     }

//     public resize(): void {
//         let bankList = this.getBankList(),
//             inventoryList = this.getInventoryList();

//         for (let [i, element] of [...bankList].entries()) {
//             let bankSlot = $(element).find(`#bank-slot${i}`),
//                 image = bankSlot.find(`#bank-image${i}`),
//                 slot = this.container.slots[i];

//             bankSlot.css({
//                 marginRight: `${2 * this.getScale()}px`,
//                 marginBottom: `${4 * this.getScale()}px`
//             });

//             bankSlot.find(`#bankItemCount${i}`).css({
//                 fontSize: `${4 * this.getScale()}px`,
//                 marginTop: '0',
//                 marginLeft: '0'
//             });

//             image.css('background-image', Utils.getImageURL(slot.key));
//         }

//         for (let [j, element] of [...inventoryList].entries()) {
//             let inventorySlot = $(element).find(`#bankInventorySlot${j}`);

//             inventorySlot.css({
//                 marginRight: `${3 * this.getScale()}px`,
//                 marginBottom: `${6 * this.getScale()}px`
//             });
//         }
//     }

//     private click(type: string, event: JQuery.ClickEvent): void {
//         let splitElement = type === 'bank' ? 'bank-slot' : 'bankInventorySlot',
//             index = parseInt(event.currentTarget.id.split(splitElement)[1]);

//         this.game.socket.send(Packets.Container, [
//             Modules.ContainerType.Bank,
//             Opcodes.Container.Select,
//             index,
//             type
//         ]);
//     }

//     public add(info: Slot | SlotData, containerType?: number): void {
//         if (containerType === undefined) return;

//         switch (containerType) {
//             case Modules.ContainerType.Bank:
//                 return this.addBank(info);

//             case Modules.ContainerType.Inventory:
//                 return this.addInventory(info);
//         }
//     }

//     public addBank(info: Slot | SlotData): void {
//         let item = $(this.getBankList()[info.index]),
//             slot = this.container.slots[info.index];

//         if (!item || !slot) return;

//         if (slot.isEmpty()) slot.load(info.key, info.count, info.ability, info.abilityLevel);

//         slot.setCount(info.count);

//         let bankSlot = item.find(`#bank-slot${info.index}`),
//             cssSlot = bankSlot.find(`#bank-image${info.index}`);

//         cssSlot.css('background-image', Utils.getImageURL(info.key));

//         if (this.scale < 3) cssSlot.css('background-size', '600%');

//         if (slot.count > 1) console.log(bankSlot.find(`#bankItemCount${info.index}`));

//         if (slot.count > 1) bankSlot.find(`#bankItemCount${info.index}`).text(slot.count);
//     }

//     public addInventory(info: Slot | SlotData): void {
//         let item = $(this.getInventoryList()[info.index]);

//         if (!item) return;

//         let slot = item.find(`#bankInventorySlot${info.index}`),
//             image = slot.find(`#inventoryImage${info.index}`);

//         image.css('background-image', Utils.getImageURL(info.key));

//         if (info.count > 1) slot.find(`#inventory-item-count${info.index}`).text(info.count);
//     }

//     public remove(info: SlotData, containerType?: number): void {
//         if (containerType === undefined) return;

//         switch (containerType) {
//             case Modules.ContainerType.Bank:
//                 return this.removeBank(info);

//             case Modules.ContainerType.Inventory:
//                 return this.removeInventory(info);
//         }

//         // let item = $(this.getBankList()[info.index]),
//         //     slot = this.container.slots[info.index];
//         // if (!item || !slot) return;
//         // let divItem = item.find(`#bank-slot${info.index}`);
//         // slot.count -= info.count;
//         // if (slot.count < 1) {
//         //     divItem.find(`#bank-image${info.index}`).css('background-image', '');
//         //     divItem.find(`#bankItemCount${info.index}`).text('');
//         //     slot.empty();
//         // } else divItem.find(`#bankItemCount${info.index}`).text(slot.count);
//     }

//     public removeBank(info: SlotData): void {
//         let item = $(this.getBankList()[info.index]),
//             slot = this.container.slots[info.index];

//         if (!item || !slot) return;

//         let divItem = item.find(`#bank-slot${info.index}`);

//         slot.count -= info.count;

//         divItem.find(`#bank-image${info.index}`).css('background-image', '');
//         divItem.find(`#bankItemCount${info.index}`).text('');
//         slot.empty();
//     }

//     public removeInventory(info: SlotData): void {
//         let item = $(this.getInventoryList()[info.index]);
//         if (!item) return;
//         /**
//          * All we're doing here is subtracting and updating the count
//          * of the items in the inventory first.
//          */

//         let slot = item.find(`#bankInventorySlot${info.index}`);

//         slot.find(`#inventoryImage${info.index}`).css('background-image', '');
//         slot.find(`#inventory-item-count${info.index}`).text('');
//     }

//     public display(): void {
//         this.body.fadeIn('slow');
//     }

//     public hide(): void {
//         this.body.fadeOut('fast');
//     }

//     public clear(): void {
//         this.bankSlot?.find('ul').empty();

//         this.bankInventorySlots?.find('ul').empty();
//     }

//     public isVisible(): boolean {
//         return this.body.css('display') === 'block';
//     }

//     private getScale(): number {
//         return this.game.app.getUIScale();
//     }

//     private getBankList(): JQuery<HTMLLIElement> {
//         return this.bankSlot.find('ul').find('li');
//     }

//     public getInventoryList(): JQuery<HTMLLIElement> {
//         return this.bankInventorySlots.find('ul').find('li');
//     }
// }
