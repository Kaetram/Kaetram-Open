import Menu from './menu';

import log from '../lib/log';
import Util from '../utils/util';
import { isMobile } from '../utils/detect';
import { onSecondaryPress } from '../utils/press';

import { Modules, Opcodes } from '@kaetram/common/network';

import type { StorePacket } from '@kaetram/common/types/messages/outgoing';
import type { SerializedStoreItem } from '@kaetram/common/types/stores';
import type Inventory from './inventory';

type SelectCallback = (opcode: Opcodes.Store, key: string, index: number, count?: number) => void;

export default class Store extends Menu {
    private key = ''; // Key of the current store
    private currency = 'gold'; // Key of the currency used, defaults to gold.

    private selectedIndex = -1; // Index of currently selected item.
    private selectedCount = -1; // Amount of currently selected item.

    private selectedBuyIndex = -1; // Index of currently selected item to buy.

    private storeContainer: HTMLElement = document.querySelector('#store-container')!;

    private storeHelp: HTMLElement = document.querySelector('#store-help')!;

    private confirmSell: HTMLElement = document.querySelector('#confirm-sell')!;

    // Sell slot information
    private sellSlot: HTMLElement = document.querySelector('#store-sell-slot')!;
    private sellSlotText: HTMLElement = document.querySelector('#store-sell-slot-text')!;
    private sellSlotReturn: HTMLElement = document.querySelector('#store-sell-slot-return')!;
    private sellSlotReturnText: HTMLElement = document.querySelector(
        '#store-sell-slot-return-text'
    )!;

    // Lists
    private storeList: HTMLUListElement = document.querySelector('#store-container > ul')!;
    private inventoryList: HTMLUListElement = document.querySelector(
        '#store-inventory-slots > ul'
    )!;

    // Buy dialog elements
    public buyDialog: HTMLElement = document.querySelector('#store-buy')!;
    private buyCount: HTMLInputElement = document.querySelector('#store-buy .dialog-count')!;
    private buyAccept: HTMLElement = document.querySelector('#store-buy .dialog-accept')!;
    private buyCancel: HTMLElement = document.querySelector('#store-buy .dialog-cancel')!;

    private selectCallback?: SelectCallback;

    public constructor(private inventory: Inventory) {
        super('#store', '#close-store');

        this.load();

        this.resize();

        this.sellSlot.addEventListener('click', this.synchronize.bind(this));
        this.confirmSell.addEventListener('click', this.sell.bind(this));

        this.buyCancel.addEventListener('click', this.hideBuyDialog.bind(this));
        this.buyAccept.addEventListener('click', this.handleBuy.bind(this));
    }

    public override resize(): void {
        let action = isMobile() ? 'Long tap' : 'Right click';

        this.storeHelp.textContent = `${action} to buy multiple items.`;
    }

    /**
     * Loads the empty inventory slots based on the size of the inventory.
     * Creates an event listener for each slot that direts to `select()`.
     */

    private load(): void {
        for (let i = 0; i < Modules.Constants.INVENTORY_SIZE; i++)
            this.inventoryList.append(
                Util.createSlot(Modules.ContainerType.Inventory, i, this.select.bind(this))
            );
    }

    /**
     * Takes the store packet data and inserts it all into the store. Note that the store packet
     * data changes depending on whether we're opening/updating or selecting an item in the store.
     * In this case, the store packet contains data about the store rather than a selected item.
     * @param info Contains the store's key, currency, and items (or specific item if selecting).
     */

    public update(info: StorePacket): void {
        this.clear();

        this.key = info.key!;
        this.currency = info.currency!;

        for (let i = 0; i < info.items!.length; i++)
            this.storeList.append(this.createStoreItem(info.items![i], i));
    }

    /**
     * Handles the initial action of clicking on an item in the inventory.
     * @param _type Unused parameter identifying the container being clicked.
     * @param index The index of the item we are selecting (in the inventory).
     */

    public select(_type: Modules.ContainerType, index: number): void {
        this.selectCallback?.(Opcodes.Store.Select, this.key, index);
    }

    /**
     * Creates the callback for the sell opcode and passes onto it the currently
     * selected item index and the count.
     */

    private sell(): void {
        this.selectCallback?.(Opcodes.Store.Sell, this.key, this.selectedIndex, this.selectedCount);
    }

    /**
     * Sends a callback signal with the buy opcode.
     * @param index The index of the item we are trying to purchase.
     * @param count Optional parameter for the amount of an item we are trying to buy.
     */

    private buy(index: number, count = 1): void {
        this.selectCallback?.(Opcodes.Store.Buy, this.key, index, count);
    }

    /**
     * Buy dialog handler. Takes the value of the input field and sends it to the server.
     */

    private handleBuy(): void {
        this.buy(this.selectedBuyIndex, this.buyCount.valueAsNumber);

        this.hideBuyDialog();
    }

    /**
     * Hides the description and shows the drop dialog. Also
     * focuses on the input field for the drop dialog.
     */

    public showBuyDialog(): void {
        Util.fadeIn(this.buyDialog);

        this.storeContainer.classList.add('dimmed');

        this.buyCount.value = '1';
        this.buyCount.focus();
    }

    /**
     * Hides the drop dialog and brings back the description info.
     */

    private hideBuyDialog(): void {
        Util.fadeOut(this.buyDialog);

        this.storeContainer.classList.remove('dimmed');
    }

    /**
     * Synchronizes the slot data between the store and the inventory.
     */

    public override synchronize(): void {
        if (!this.isVisible()) return;

        this.clearSellSlot();

        this.inventory.forEachSlot((index: number, slot: HTMLElement) => {
            let image = this.getElement(index).querySelector<HTMLElement>('.item-image')!,
                count = this.getElement(index).querySelector<HTMLElement>('.item-count')!,
                slotImage = slot.querySelector<HTMLElement>('.item-image')!;

            if (!slotImage) return;

            image.style.backgroundImage = slotImage.style.backgroundImage;
            count.textContent = slot.textContent;
        });
    }

    /**
     * Displays the store UI and updates the items
     * in the store inventory.
     * @param info Store packet data containing information about the store.
     */

    public override show(info: StorePacket): void {
        super.show();

        this.update(info);
        this.synchronize();
    }

    /**
     * Clears the store so that new data can be inserted
     * once again. Clears the key of the currently open store,
     * defaults the currency, and empties the list of store items.
     */

    private clear(): void {
        this.key = '';
        this.currency = 'gold';

        this.storeList.innerHTML = '';
    }

    /**
     * Clears the sell slots and selected item index. Removes all the image
     * and text contents from the HTML elements and clears the index and count.
     */

    private clearSellSlot(): void {
        this.selectedIndex = -1;
        this.selectedCount = -1;

        this.sellSlot.style.backgroundImage = '';
        this.sellSlotText.textContent = '';
        this.sellSlotReturn.style.backgroundImage = '';
        this.sellSlotReturnText.textContent = '';
    }

    /**
     * When the server sends a select packet, we use this function
     * to move an item from the inventory to the select slot. We also
     * add the currency and price to bottom slots.
     * @param info Contains store packet data such as the index, key, price, etc.
     */

    public move(info: StorePacket): void {
        if (info.key !== this.key) return log.error(`Invalid store key provided for the select.`);

        //Refreshes the inventory container prior to moving.s
        this.synchronize();

        let image = this.getElement(info.item!.index!).querySelector<HTMLElement>('.item-image')!,
            count = this.getElement(info.item!.index!).querySelector<HTMLElement>('.item-count')!;

        if (!image || !count) return log.error(`[Store] Could not find image and count elements.`);

        // Updates the sell slot.
        this.sellSlot.style.backgroundImage = image.style.backgroundImage;
        this.sellSlotText.textContent = count.textContent;
        this.sellSlotReturn.style.backgroundImage = Util.getImageURL(this.currency);
        this.sellSlotReturnText.textContent = info.item!.price.toString() || '';

        // Visually removes the item from the inventory.
        image.style.backgroundImage = '';
        count.textContent = '';

        // Store the currently selected item index and count for when we sell.
        this.selectedIndex = info.item!.index!;
        this.selectedCount = info.item!.count!;
    }

    /**
     * Creates a new store element item and returns it.
     * @param item Contains data about the item (price, image, name, etc).
     * @returns An HTML list element that can be appended to the list of store items.
     */

    private createStoreItem(item: SerializedStoreItem, index: number): HTMLElement {
        let listElement = document.createElement('li'),
            image = document.createElement('div'),
            name = document.createElement('div'),
            count = document.createElement('div'),
            price = document.createElement('div');

        // Add the class to the elements.
        listElement.classList.add('store-item');
        image.classList.add('store-item-image');
        name.classList.add('store-item-name', 'stroke');
        count.classList.add('store-item-count', 'stroke');
        price.classList.add('store-item-price', 'stroke');

        // Set the text HTML values for the children elements.
        if (item.count !== -1) count.textContent = `x${item.count.toString()}`;
        name.textContent = item.name;
        price.textContent = `${item.price.toString()}${this.currency[0]}`;

        // Update the image of the element.
        image.style.backgroundImage = Util.getImageURL(item.key);

        listElement.addEventListener('click', () => this.buy(index));
        onSecondaryPress(listElement, () => {
            this.selectedBuyIndex = index;

            this.showBuyDialog();
        });

        // Append all the elements together and nest them.
        listElement.append(image, name, count, price);

        return listElement;
    }

    /**
     * Grabs the HTMLElement at a specified index within the
     * inventory slot list.
     * @param index The index of the element to grab.
     * @returns The HTMLElement at the specified index.
     */

    private getElement(index: number): HTMLElement {
        return this.inventoryList.children[index].querySelector('div') as HTMLElement;
    }

    /**
     * Select callback for whenever a store action is performed. This includes
     * buying, selling, or selecting an item.
     * @param callback Passes data such as the type of action performed and index.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
