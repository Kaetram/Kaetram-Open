/**
 * Skeleton for the equipment itself. An equipment
 * is just an item that is stored in the player's
 * equipment slot instead of inventory slot.
 */

import Utils from '@kaetram/common/util/utils';

import type { Modules } from '@kaetram/common/network';
import type { EquipmentData } from '@kaetram/common/types/equipment';
import type { Bonuses, Enchantments, Stats } from '@kaetram/common/types/item';
import type Item from '../../../objects/item';

export default class Equipment {
    // Properties
    public name = '';

    public attackRange = 1;
    public lumberjacking = -1;
    public mining = -1;
    public poisonous = false;

    // Stats
    public attackStats: Stats = Utils.getEmptyStats();
    public defenseStats: Stats = Utils.getEmptyStats();
    public bonuses: Bonuses = Utils.getEmptyBonuses();

    private updateCallback?: (equipment: Equipment) => void;

    // Basic initialization
    public constructor(
        public type: Modules.Equipment,
        public key = '',
        public count = 1,
        public enchantments: Enchantments = {}
    ) {}

    /**
     * Updates the item in the slot.
     * @param item Item instance used to update the slot with.
     */

    public update(item: Item, count = 1): void {
        this.key = item.key;
        this.name = item.name;
        this.count = count;
        this.enchantments = item.enchantments;

        this.lumberjacking = item.lumberjacking;
        this.mining = item.mining;
        this.poisonous = item.poisonous;

        this.attackStats = item.attackStats;
        this.defenseStats = item.defenseStats;
        this.bonuses = item.bonuses;

        this.updateCallback?.(this);
    }

    /**
     * Clears the slot of the item contained.
     */

    public empty(): void {
        this.key = '';

        this.count = 1;
        this.enchantments = {};

        this.name = '';

        this.attackRange = 1;
        this.lumberjacking = -1;
        this.mining = -1;
        this.poisonous = false;

        this.attackStats = Utils.getEmptyStats();
        this.defenseStats = Utils.getEmptyStats();
        this.bonuses = Utils.getEmptyBonuses();
    }

    /**
     * Checks if the equipment slot contains an item.
     * @returns If the key is null or not.
     */

    public isEmpty(): boolean {
        return !this.key;
    }

    /**
     * Checks if the item is a lumberjacking item. Lumberjacking items are
     * defined by equipments that have a lumberjacking value greater than 0.
     * @returns If the lumberjacking attribute is greater than 0.
     */

    public isLumberjacking(): boolean {
        return this.lumberjacking > 0;
    }

    /**
     * Whether or not this weapon can be used for mining.
     * @returns Whether the mining weapon level is greater than 0.
     */

    public isMining(): boolean {
        return this.mining > 0;
    }

    /**
     * Serializes the equipment information into a JSON object that may either be
     * saved in the database or sent to the client depending on the context.
     * @param clientInfo Whether or not to include data that is only relevant to the client.
     * @returns The serialized equipment data.
     */

    public serialize(clientInfo = false): EquipmentData {
        let data: EquipmentData = {
            type: this.type,
            key: this.key,
            count: this.count,
            enchantments: this.enchantments
        };

        // Includes information only relevant to the client.
        if (clientInfo) {
            data.name = this.name;
            data.attackRange = this.attackRange;
            data.poisonous = this.poisonous;

            data.attackStats = this.attackStats;
            data.defenseStats = this.defenseStats;
            data.bonuses = this.bonuses;
        }

        return data;
    }

    // Callback for when the currently equipped item is updated.
    public onUpdate(callback: (equipment: Equipment) => void): void {
        this.updateCallback = callback;
    }
}
