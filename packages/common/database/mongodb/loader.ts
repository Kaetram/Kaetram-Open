import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import type Player from '@kaetram/server/src/game/entity/character/player/player';
import type { Db } from 'mongodb';
import type { SerializedAbility } from '@kaetram/common/types/ability';
import type { AchievementData, SerializedAchievement } from '@kaetram/common/types/achievement';
import type { EquipmentData, SerializedEquipment } from '@kaetram/common/types/equipment';
import type { QuestData, SerializedQuest } from '@kaetram/common/types/quest';
import type { SerializedSkills, SkillData } from '@kaetram/common/types/skills';
import type { SerializedContainer, SlotData } from '@kaetram/common/types/slot';
import type { StatisticsData } from '@kaetram/common/types/statistics';

export default class Loader {
    public constructor(private database?: Db) {}

    /**
     * Generalized function for loading data from the database. It will return a
     * data type that is later parsed by the caller. We use this since most serialized
     * information in Kaetram is stored in a similar fashion, thus cleaning up the code.
     * Empty arrays are passed when we cannot find data (or the server is in offline mdoe).
     * @param username The username we are searching for in the collection.
     * @param collection The name of the collection.
     * @param callback Raw data from the database or nothing if a problem occurs.
     */

    public load(username: string, collection: string, callback: (data?: never) => void): void {
        // Used for when we're working without a database to return empty data.
        if (!this.database || config.skipDatabase) return callback();

        let cursor = this.database.collection(collection).find({ username });

        cursor.toArray().then((info) => {
            if (info.length > 1) log.warning(`[${collection}] Duplicate entry for ${username}.`);

            // Return empty array if we can't find any data.
            if (info.length === 0) return callback();

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
            if (!info) {
                log.warning(`[player_equipment] No equipment found for ${player.username}.`);
                return callback([]);
            }

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
            if (!info) {
                log.warning(`[player_inventory] No inventory found for ${player.username}.`);
                return callback([]);
            }

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
            if (!info) {
                log.warning(`[player_bank] No bank found for ${player.username}.`);
                return callback([]);
            }

            let [{ slots }] = info as SerializedContainer[];

            callback(slots);
        });
    }

    /**
     * Loads the quest data from the database and returns it into a QuestData array object.
     * @param player The player we are extracting the quest data from.
     * @param callback The quest data in an array format of type QuestData.
     */

    public loadQuests(player: Player, callback: (questData: QuestData[]) => void): void {
        this.load(player.username, 'player_quests', (info: unknown) => {
            if (!info) return callback([]);

            let [{ quests }] = info as SerializedQuest[];

            callback(quests);
        });
    }

    /**
     * Achievements are loaded pretty mucht the same way as quests. We parse through
     * the data and return it into an array of type AchievementData. Each element
     * contains information about the specific achievement.
     * @param player Player we are grabbing the achievement data for.
     * @param callback Contains an array of achievement objects.
     */

    public loadAchievements(
        player: Player,
        callback: (achievements: AchievementData[]) => void
    ): void {
        this.load(player.username, 'player_achievements', (info: unknown) => {
            if (!info) return callback([]);

            let [{ achievements }] = info as SerializedAchievement[];

            callback(achievements);
        });
    }

    /**
     * Loads the skill data from the database and returns it into a SkillData array object.
     * @param player The player we are extracting the skill data from.
     * @param callback The skill data in an array format of type SkillData.
     */

    public loadSkills(player: Player, callback: (skills: SkillData[]) => void): void {
        this.load(player.username, 'player_skills', (info: unknown) => {
            if (!info) {
                log.warning(`[player_skills] No skills found for ${player.username}.`);
                return callback([]);
            }

            let [{ skills }] = info as SerializedSkills[];

            callback(skills);
        });
    }

    /**
     * Loads the statistics data from the database and returns it into a StatisticsData object.
     * @param player The player we are loading the statistics data for.
     * @param callback Contains the statistics data from the database.
     */

    public loadStatistics(player: Player, callback: (statistics: StatisticsData) => void): void {
        this.load(player.username, 'player_statistics', (info: unknown) => {
            if (!info)
                return log.warning(
                    `[player_statistics] No statistics found for ${player.username}.`
                );

            let [statistics] = info as StatisticsData[];

            callback(statistics);
        });
    }

    /**
     * Loads the abilities information from the database and returns a SerializedAbilities object.
     * @param player The palyer we are loading the abilities data for.
     * @param callback Contains the abilities data from the database.
     */

    public loadAbilities(player: Player, callback: (abilities: SerializedAbility) => void): void {
        this.load(player.username, 'player_abilities', (info: unknown) => {
            if (!info)
                return log.warning(`[player_abilities] No abilities found for ${player.username}.`);

            let [abilities] = info as SerializedAbility[];

            callback(abilities);
        });
    }
}
