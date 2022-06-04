import _ from 'lodash';

import Game from '../game';
import Menu from '../menu/menu';

import Actions from '../menu/actions';
import Inventory from '../menu/inventory';
import Bank from '../menu/bank';
import Store from '../menu/store';
import Header from '../menu/header';
import Profile from '../menu/profile/profile';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

export default class MenuController {
    private actions: Actions = new Actions();

    private inventory: Inventory = new Inventory(this.actions);
    private bank: Bank = new Bank(this.inventory);
    private store: Store = new Store(this.inventory);
    private profile: Profile = new Profile(this.game.player);

    public menu: Menu[] = [this.inventory, this.bank, this.store, this.profile];

    public constructor(private game: Game) {
        this.inventory.onSelect(this.handleInventorySelect.bind(this));
        this.bank.onSelect(this.handleBankSelect.bind(this));
        this.store.onSelect(this.handleStoreSelect.bind(this));

        this.profile.onUnequip(this.handleProfileUnequip.bind(this));

        this.load();
    }

    /**
     * Initializes the header and a callback that automatically
     * hides all the other menus when a menu is shown.
     */

    private load(): void {
        new Header(this.game.player);

        this.forEachMenu((menu: Menu) => menu.onShow(() => this.hide()));
    }

    /**
     * Iterates through all menus and calls the hide function.
     * This is used when we want to hide every user interface.
     
     */
    public hide(): void {
        this.forEachMenu((menu: Menu) => menu.hide());
    }

    /**
     * Synchronizes the contains and the UI for all menus.
     */

    public synchronize(): void {
        this.forEachMenu((menu: Menu) => menu.synchronize());
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
     * @returns The profile menu object.
     */

    public getProfile(): Profile {
        return this.profile;
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
     * Callback for when a store selection occurs. This is the packet format for when
     * an item in the inventory is selected, when it is sold, or when we are attempting
     * to purchase an item from the store.
     * @param opcode The type of action we are performing.
     * @param key The key of the store that we are in.
     * @param index The index of the item (whether in the inventory or store).
     */

    private handleStoreSelect(opcode: Opcodes.Store, key: string, index: number, count = 1): void {
        this.game.socket.send(Packets.Store, {
            opcode,
            key,
            index,
            count
        });
    }

    /**
     * Callback received from one of the profile pages when
     * an equipment slot is clicked. We send a packet to the
     * server requesting unequipping.
     * @param type What slot is being unequipped.
     */

    private handleProfileUnequip(type: Modules.Equipment): void {
        this.game.socket.send(Packets.Equipment, {
            opcode: Opcodes.Equipment.Unequip,
            type
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
