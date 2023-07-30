import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

import type Item from '../../../../objects/item';
import type { Enchantments } from '@kaetram/common/types/item';
import type { EquipmentData } from '@kaetram/common/network/impl/equipment';

export default class Shield extends Equipment {
    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Shield, key, count, enchantments);
    }

    /**
     * Override for the update function to include the light property
     * of the item the player is equipping.
     * @param item The item object the player wants to equip.
     */

    public override update(item: Item): void {
        super.update(item);

        this.light = item.light;
    }

    /**
     * Override for the serialize function to include the light
     * object for the shield.
     * @param clientInfo Whether or not the data is sent to the client
     * or is used for database storage.
     */

    public override serialize(clientInfo = false): EquipmentData {
        let data = super.serialize(clientInfo);

        if (clientInfo) data.light = this.light;

        return data;
    }
}
