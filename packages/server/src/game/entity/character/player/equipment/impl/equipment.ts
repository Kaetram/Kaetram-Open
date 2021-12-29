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
        public abilityLevel = -1
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
     * Serializes the information about the equipment and returns it in the format
     * of the SEquipemnt interface object.
     * @returns An SEquipment object containing the id, count, ability, and abilityLevel
     */

    public serialize(): EquipmentData {
        let { type, key, name, count, ability, abilityLevel } = this;

        return {
            type,
            key,
            name,
            count,
            ability,
            abilityLevel
        };
    }

    // Callback for when the currently equipped item is updated.
    public onUpdate(callback: (equipment: Equipment) => void): void {
        this.updateCallback = callback;
    }
}
