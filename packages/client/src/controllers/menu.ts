import _ from 'lodash';

import Game from '../game';
import Menu from '../menu/menu';

import Actions from '../menu/actions';
import Inventory from '../menu/inventory';
import Bank from '../menu/bank';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';
import Store from '../menu/store';

export default class MenuController {
    private actions: Actions = new Actions();

    private inventory: Inventory = new Inventory(this.actions);
    private bank: Bank = new Bank(this.inventory);
    private store: Store = new Store();

    public menu: Menu[] = [this.inventory, this.bank, this.store];

    public constructor(private game: Game) {
        this.inventory.onSelect(this.handleInventorySelect.bind(this));
        this.bank.onSelect(this.handleBankSelect.bind(this));
    }

    /**
     * Iterates through all menus and calls the hide function.
     * This is used when we want to hide every user interface.
     
     */
    public hide(): void {
        this.forEachMenu((menu: Menu) => menu.hide());
    }

    /**
     * @returns The inventory menu object.
     */

    public getInventory(): Inventory {
        return this.inventory;
    }

    /**
     * @returns The bank menu object.
     */

    public getBank(): Bank {
        return this.bank;
    }

    /**
     * @returns The store menu object.
     */

    public getStore(): Store {
        return this.store;
    }

    /**
     * Callback handler for when an item in the inventory is selected.
     * @param index Index of the item selected.
     * @param opcode Opcode identifying the type of action performed on the item.
     * @param tIndex Optional parameter passed when we specify a selected slot to swap with.
     */

    private handleInventorySelect(index: number, opcode: Opcodes.Container, tIndex?: number): void {
        this.game.socket.send(Packets.Container, {
            opcode,
            type: Modules.ContainerType.Inventory,
            index,
            tIndex
        });
    }

    /**
     * Callback handler for when an item in the bank is selected.
     * @param type Indicates which container (inventory or bank) was selected.
     * @param index The index within that container.
     */

    private handleBankSelect(type: Modules.ContainerType, index: number): void {
        this.game.socket.send(Packets.Container, {
            opcode: Opcodes.Container.Select,
            type: Modules.ContainerType.Bank,
            subType: type,
            index
        });
    }

    /**
     * Iterates through all the menus and passes a callback.
     * @param callback Current menu being iterated through.
     */

    private forEachMenu(callback: (menu: Menu) => void): void {
        _.each(this.menu, callback);
    }
}
