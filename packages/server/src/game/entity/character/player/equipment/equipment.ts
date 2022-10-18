/**
 * Skeleton for the equipment itself. An equipment
 * is just an item that is stored in the player's
 * equipment slot instead of inventory slot.
 */

import { Modules } from '@kaetram/common/network';
import { EquipmentData } from '@kaetram/common/types/equipment';
import Item from '../../../objects/item';

export default class Equipment {
    // Properties
    public name = '';

    public ranged = false;
    public lumberjacking = -1;
    public poisonous = false;

    // Stats
    public crush = 0;
    public slash = 0;
    public stab = 0;
    public magic = 0;

    // Bonuses
    public dexterity = 0;
    public strength = 0;
    public archery = 0;

    private updateCallback?: (equipment: Equipment) => void;

    // Basic initialization
    public constructor(
        public type: Modules.Equipment,
        public key = '',
        public count = 1,
        public ability = -1,
        public abilityLevel = -1
    ) {}

    /**
     * Updates the item in the slot.
     * @param item Item instance used to update the slot with.
     */

    public update(item: Item, count = 1): void {
        this.key = item.key;
        this.name = item.name;
        this.count = count;
        this.ability = item.ability;
        this.abilityLevel = item.abilityLevel;

        this.lumberjacking = item.lumberjacking;
        this.poisonous = item.poisonous;

        this.crush = item.crush;
        this.slash = item.slash;
        this.stab = item.stab;
        this.magic = item.magic;

        this.dexterity = item.dexterity;
        this.strength = item.strength;
        this.archery = item.archery;

        this.updateCallback?.(this);
    }

    /**
     * Clears the slot of the item contained.
     */

    public empty(): void {
        this.key = '';

        this.count = 1;
        this.ability = -1;
        this.abilityLevel = -1;

        this.name = '';

        this.ranged = false;
        this.lumberjacking = -1;
        this.poisonous = false;

        this.crush = 0;
        this.slash = 0;
        this.stab = 0;
        this.magic = 0;

        this.dexterity = 0;
        this.strength = 0;
        this.archery = 0;
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
            ability: this.ability,
            abilityLevel: this.abilityLevel
        };

        // Includes information only relevant to the client.
        if (clientInfo) {
            data.name = this.name;
            data.ranged = this.ranged;
            data.poisonous = this.poisonous;

            data.stats = {
                crush: this.crush,
                slash: this.slash,
                stab: this.stab,
                magic: this.magic,
                dexterity: this.dexterity,
                strength: this.strength,
                archery: this.archery
            };
        }

        return data;
    }

    // Callback for when the currently equipped item is updated.
    public onUpdate(callback: (equipment: Equipment) => void): void {
        this.updateCallback = callback;
    }
}
