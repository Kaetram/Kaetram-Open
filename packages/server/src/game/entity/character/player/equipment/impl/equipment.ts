/**
 * Skeleton for the equipment itself. An equipment
 * is just an item that is stored in the player's
 * equipment slot instead of inventory slot.
 */

import { Modules } from '@kaetram/common/network';
import { SEquipment } from '@kaetram/common/types/equipment';

export default class Equipment {
    private updateCallback?: (itemString: string) => void;

    // Basic initialization
    public constructor(
        public type: Modules.Equipment,
        public id: number,
        public count = 1,
        public ability = -1,
        public abilityLevel = -1
    ) {}

    /**
     * Updates the equipment with the given item information.
     * @param id The item id.
     * @param count The count of items (if we are wearing arrows)
     * @param ability Ability type of the item.
     * @param abilityLevel Ability level of the item.
     */

    public update(id: number, count = 1, ability = -1, abilityLevel = -1): void {
        this.id = id;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;

        this.updateCallback?.(this.id === -1 ? 'null' : Items.idToString(this.id));
    }

    /**
     * Serializes the information about the equipment and returns it in the format
     * of the SEquipemnt interface object.
     * @returns An SEquipment object containing the id, count, ability, and abilityLevel
     */

    public serialize(): SEquipment {
        let { type, id, count, ability, abilityLevel } = this;

        return {
            type,
            id,
            count,
            ability,
            abilityLevel
        };
    }

    // Callback for when the currently equipped item is updated.
    public onUpdate(callback: (itemString: string) => void): void {
        this.updateCallback = callback;
    }
}
