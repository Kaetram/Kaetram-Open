import log from '@kaetram/common/util/log';

import type { Db } from 'mongodb';
import type { EquipmentData, SerializedEquipment } from '@kaetram/common/types/equipment';
import type { SerializedContainer, SlotData } from '@kaetram/common/types/slot';
import type Player from '../../game/entity/character/player/player';

export default class Loader {
    public constructor(private database: Db) {}

    /**
     * Grabs the player equipment system from the database.
     * @param player The player we are extracting username from to load.
     * @param callback Callback of the equipment information.
     */

    public loadEquipment(player: Player, callback: (equipmentInfo: EquipmentData[]) => void): void {
        let cursor = this.database
            .collection<SerializedEquipment>('player_equipment')
            .find({ username: player.username });

        cursor.toArray().then((info) => {
            if (info.length > 1)
                log.warning(`[player_equipment] Duplicate entry for ${player.username}.`);

            if (info.length === 0) return callback([]);

            let [{ equipments }] = info;

            callback(equipments);
        });
    }

    /**
     * Grabs the player inventory system from the database.
     * @param player The player we are extracting username from to load.
     * @param callback Callback of the inventory information.
     */

    public loadInventory(player: Player, callback: (inventoryData: SlotData[]) => void): void {
        let cursor = this.database
            .collection<SerializedContainer>('player_inventory')
            .find({ username: player.username });

        cursor.toArray().then((info) => {
            if (info.length > 1)
                log.warning(`[player_inventory] Duplicate entry for ${player.username}.`);

            if (info.length === 0) return callback([]);

            let [{ slots }] = info;

            callback(slots);
        });
    }

    /**
     * Grabs the player bank system from the database.
     * @param player The player we are extracting username from to load.
     * @param callback Callback of the bank information.
     */

    public loadBank(player: Player, callback: (inventoryData: SlotData[]) => void): void {
        let cursor = this.database
            .collection<SerializedContainer>('player_bank')
            .find({ username: player.username });

        cursor.toArray().then((info) => {
            if (info.length > 1)
                log.warning(`[player_bank] Duplicate entry for ${player.username}.`);

            if (info.length === 0) return callback([]);

            let [{ slots }] = info;

            callback(slots);
        });
    }
}
