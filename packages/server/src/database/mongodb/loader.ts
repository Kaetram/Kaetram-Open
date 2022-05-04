import log from '@kaetram/common/util/log';

import type { Db } from 'mongodb';
import type { EquipmentData, SerializedEquipment } from '@kaetram/common/types/equipment';
import type { SerializedContainer, SlotData } from '@kaetram/common/types/slot';
import type Player from '../../game/entity/character/player/player';
import type { QuestData, SerializedQuest } from '@kaetram/common/types/quest';
import type { SerializedSkills } from '@kaetram/common/types/skills';

export default class Loader {
    public constructor(private database: Db) {}

    /**
     * Generalized function for loading data from the database. It will return a
     * data type that is later parsed by the caller. We use this since most serialized
     * information in Kaetram is stored in a similar fashion, thus cleaning up the code.
     * @param username The username we are searching for in the collection.
     * @param collection The name of the collection.
     * @param callback Raw data from the database.
     */

    public load(username: string, collection: string, callback: (data: never) => void): void {
        let cursor = this.database.collection(collection).find({ username });

        cursor.toArray().then((info) => {
            if (info.length > 1) log.warning(`[${collection}] Duplicate entry for ${username}.`);

            // Return empty array if we can't find any data.
            if (info.length === 0) return callback([] as never);

            // Return the raw data from the database.
            callback(info as never);
        });
    }

    /**
     * Grabs the player equipment system from the database.
     * @param player The player we are extracting username from to load.
     * @param callback Callback of the equipment information.
     */

    public loadEquipment(player: Player, callback: (equipmentInfo: EquipmentData[]) => void): void {
        this.load(player.username, 'player_equipment', (info: unknown) => {
            let [{ equipments }] = info as SerializedEquipment[];

            callback(equipments);
        });
    }

    /**
     * Grabs the player inventory system from the database.
     * @param player The player we are extracting username from to load.
     * @param callback Callback of the inventory information.
     */

    public loadInventory(player: Player, callback: (inventoryData: SlotData[]) => void): void {
        this.load(player.username, 'player_inventory', (info: unknown) => {
            let [{ slots }] = info as SerializedContainer[];

            callback(slots);
        });
    }

    /**
     * Grabs the player bank system from the database.
     * @param player The player we are extracting username from to load.
     * @param callback Callback of the bank information.
     */

    public loadBank(player: Player, callback: (inventoryData: SlotData[]) => void): void {
        this.load(player.username, 'player_bank', (info: unknown) => {
            let [{ slots }] = info as SerializedContainer[];

            callback(slots);
        });
    }

    /**
     * Loads teh quest data from the database and returns it into a QuestData array object.
     * @param player The player we are extracting the quest data from.
     * @param callback The quest data in an array format of type QuestData.
     */

    public loadQuests(player: Player, callback: (questData: QuestData[]) => void): void {
        this.load(player.username, 'player_quests', (info: unknown) => {
            let [{ quests }] = info as SerializedQuest[];

            callback(quests);
        });
    }

    public loadSkills(player: Player, callback: (skills: unknown) => void): void {
        this.load(player.username, 'player_skills', (info: unknown) => {
            let [{ skills }] = info as SerializedSkills[];

            callback(skills);
        });
    }
}
