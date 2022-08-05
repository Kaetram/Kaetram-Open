/**
 * Skeleton for the equipment itself. An equipment
 * is just an item that is stored in the player's
 * equipment slot instead of inventory slot.
 */

import { Modules } from '@kaetram/common/network';
import { EquipmentData } from '@kaetram/common/types/equipment';
import Item from '../../../objects/item';

export default class Equipment {
    private updateCallback?: (equipment: Equipment) => void;
    public name = '';

    // Basic initialization
    public constructor(
        public type: Modules.Equipment,
        public key = '',
        public count = 1,
        public ability = -1,
        public abilityLevel = -1,
        public power = 1,
        public ranged = false, // Applies to weapons specifically
        public amplifier = 1,
        public lumberjacking = -1,
        public poisonous = false
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
        this.power = 0;
        this.amplifier = 1;
        this.lumberjacking = -1;
        this.poisonous = false;
        this.name = '';
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
     * Returns the amplifier bonus used to calculate
     * extra damage. Generally associated with pendants,
     * rings, and boots.
     * @returns Integer value of the amplifier.
     */

    public getAmplifier(): number {
        return this.amplifier;
    }

    /**
     * Serializes the information about the equipment and returns it in the format
     * of the SEquipemnt interface object.
     * @returns An SEquipment object containing the id, count, ability, and abilityLevel
     */

    public serialize(): EquipmentData {
        let { type, key, name, count, ability, abilityLevel, power, ranged, poisonous } = this;

        return {
            type,
            key,
            name,
            count,
            ability,
            abilityLevel,
            power,
            ranged,
            poisonous
        };
    }

    // Callback for when the currently equipped item is updated.
    public onUpdate(callback: (equipment: Equipment) => void): void {
        this.updateCallback = callback;
    }
}
