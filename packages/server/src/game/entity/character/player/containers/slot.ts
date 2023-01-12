import Utils from '@kaetram/common/util/utils';

import type Item from '../../../objects/item';
import type { SlotData } from '@kaetram/common/types/slot';
import type { Bonuses, Enchantments, Stats } from '@kaetram/common/types/item';

export default class Slot {
    public edible = false;
    public equippable = false;

    private name = '';
    private attackStats: Stats = Utils.getEmptyStats();
    private defenseStats: Stats = Utils.getEmptyStats();
    private bonuses: Bonuses = Utils.getEmptyBonuses();

    // Max amount of an item we can put in a slot.
    private maxStackSize = 1;

    public constructor(
        public index: number,
        public key = '',
        public count = 0,
        public enchantments: Enchantments = {}
    ) {}

    /**
     * Takes an item as a parameter and places all of that data in
     * the current slot. Once finished, we send a callback to despawn
     * the item from the world.
     * @param item An item object that we extract data from.
     */

    public update(item: Item): void {
        this.key = item.key;
        this.count = item.count;
        this.enchantments = item.enchantments;

        this.edible = item.edible;
        this.equippable = item.isEquippable();

        this.name = item.name;
        this.attackStats = item.attackStats;
        this.defenseStats = item.defenseStats;
        this.bonuses = item.bonuses;

        if (item.stackable) this.maxStackSize = item.maxStackSize;

        item.despawn(true); // Despawn signal towards the item once we update the slot.
    }

    /**
     * Tries to add an amount to the current count in the slot. If successful
     * we return true, otherwise we return false.
     * @param amount The amount of an item to add.
     * @returns Whether or not adding to the slot is successful.
     */

    public add(amount: number): boolean {
        if (this.isFull(this.count + amount)) return false;

        this.count += amount;

        return true;
    }

    /**
     * Checks if the current slot can hold the item.
     * @param item The item to check.
     * @returns Whether or not the item can be held.
     */

    public canHold(item: Item): boolean {
        return this.key === item.key && !this.isFull(this.count + item.count);
    }

    /**
     * Removes an amount from the count in the slot.
     * @param amount Amount we are removing from the slot.
     * @returns The amount of the item we removed.
     */

    public remove(amount: number): number {
        if (this.isEmpty(this.count - amount)) return this.count;

        this.count -= amount;

        return amount;
    }

    /**
     * Clears all the variables in the slot and returns
     * them back to their default state (if the slot is emptied).
     */

    public clear(): void {
        this.key = '';
        this.count = 0;
        this.enchantments = {};

        this.edible = false;
        this.equippable = false;
        this.maxStackSize = 1;

        this.name = '';
        this.attackStats = Utils.getEmptyStats();
        this.defenseStats = Utils.getEmptyStats();
        this.bonuses = Utils.getEmptyBonuses();
    }

    /**
     * Checks if there is any room left in the current slot.
     * @param count Optional parameter to check against.
     * @returns If the count in the slot are greater or equal to max stack.
     */

    public isFull(count = this.count): boolean {
        return count > this.maxStackSize;
    }

    /**
     * Checks if the slot is empty. If the `count` parameter is specified
     * it checks if that variable is empty.
     * @param count Optional parameter to check against.
     * @returns If the slot is empty.
     */

    public isEmpty(count = this.count): boolean {
        return count <= 0;
    }

    /**
     * Returns the data in the slot in the form of a SlotData object.
     * @returns SlotData interface object.
     */

    public serialize(): SlotData {
        let {
            index,
            key,
            count,
            enchantments,
            edible,
            equippable,
            name,
            attackStats,
            defenseStats,
            bonuses
        } = this;

        return {
            index,
            key,
            count,
            enchantments,
            edible,
            equippable,
            name,
            attackStats,
            defenseStats,
            bonuses
        };
    }
}
