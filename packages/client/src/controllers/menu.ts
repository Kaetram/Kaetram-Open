import _ from 'lodash';

import Game from '../game';
import Menu from '../menu/menu';

import Actions from '../menu/actions';
import Inventory from '../menu/inventory';
import Bank from '../menu/bank';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

export default class MenuController {
    private actions: Actions = new Actions();

    private inventory: Inventory = new Inventory(this.actions);
    private bank: Bank = new Bank();

    public menu: Menu[] = [this.inventory, this.bank];

    public constructor(private game: Game) {
        this.inventory.onSelect(this.handleInventorySelect.bind(this));
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
     * Callback handler for when an item in the inventory is selected.
     * @param index Index of the item selected.
     */

    private handleInventorySelect(index: number): void {
        this.game.socket.send(Packets.Container, {
            opcode: Opcodes.Container.Select,
            type: Modules.ContainerType.Inventory,
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
