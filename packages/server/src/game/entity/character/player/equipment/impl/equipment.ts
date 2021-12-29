/**
 * Skeleton for the equipment itself. An equipment
 * is just an item that is stored in the player's
 * equipment slot instead of inventory slot.
 */

import { Modules } from '@kaetram/common/network';
import { EquipmentData } from '@kaetram/common/types/equipment';
import Item from '../../../../objects/item';

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
        public power = 1
    ) {}

    /**
     * Updates the equipment with the given item information.
     * @param key The item's key.
     * @param count The count of items (if we are wearing arrows)
     * @param ability Ability type of the item.
     * @param abilityLevel Ability level of the item.
     */

    public update(item: Item): void {
        this.key = item.key;
        this.name = item.name;
        this.count = item.count;
        this.ability = item.ability;
        this.abilityLevel = item.abilityLevel;

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
    }

    /**
     * Checks if the equipment slot contains an item.
     * @returns If the key is null or not.
     */

    public isEmpty(): boolean {
        return !this.key;
    }

    /**
     * Serializes the information about the equipment and returns it in the format
     * of the SEquipemnt interface object.
     * @returns An SEquipment object containing the id, count, ability, and abilityLevel
     */

    public serialize(): EquipmentData {
        let { type, key, name, count, ability, abilityLevel, power } = this;

        return {
            type,
            key,
            name,
            count,
            ability,
            abilityLevel,
            power
        };
    }

    // Callback for when the currently equipped item is updated.
    public onUpdate(callback: (equipment: Equipment) => void): void {
        this.updateCallback = callback;
    }
}
