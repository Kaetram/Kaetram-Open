import bcryptjs from 'bcryptjs';
import { Db } from 'mongodb';

import type Player from '../../game/entity/character/player/player';

import log from '@kaetram/common/util/log';
import { Modules } from '@kaetram/common/network';

import type { Collection } from 'mongodb';

export interface PlayerInfo {
    username: string;
    password: string;
    email: string;
    x: number;
    y: number;
    userAgent: string;
    experience: number;
    rights: number;
    poison: string;
    hitPoints: number;
    mana: number;
    pvpKills: number;
    pvpDeaths: number;
    orientation: Modules.Orientation;
    ban: number;
    mute: number;
    lastLogin: number;
    lastWarp: number;
    mapVersion: number;
}

/**
 * Side-note. This version of the creator is a lot more compact and optimized.
 * The data that we are serializing ALWAYS exists. Because of this alone there
 * should be nearly no crashes since we are always working with non-null variables.
 */

export default class Creator {
    public constructor(private database: Db) {}

    /**
     * Takes every information about the player and saves it. Individual
     * objects such as equipment, inventory, bank, etc. are stored in separate
     * collections for organization purposes.
     * @param player The player character we are saving.
     */

    public save(player: Player): void {
        try {
            log.debug(`Saving player information for ${player.username}.`);

            this.saveInfo(player);
            this.saveEquipment(player);
        } catch (error: unknown) {
            log.error(`Could not save data for ${player.username}.`);
            console.log(error);
        }
    }

    /**
     * Saves the basic variable information about the player.
     * See `PlayerInfo` for more information.
     */

    public saveInfo(player: Player): void {
        let collection = this.database.collection('player_info');

        this.getPlayerWithHash(player, (playerInfo: PlayerInfo) => {
            this.updateCollection(collection, player.username, playerInfo);
        });
    }

    /**
     * Serializes the equipment data of the player and
     * stores it into the database.
     */

    public saveEquipment(player: Player): void {
        let collection = this.database.collection('player_equipment');

        // Pass the serialized equipment as parameter.
        this.updateCollection(collection, player.username, player.equipment.serialize());
    }

    /**
     * The brains of the operation for storing/updating data to MongoDB.
     * We provide the collection, username, data.
     * and we save all that information into the database.
     * @param collection The collection we are saving to (e.g. player_info, player_equipment, etc.)
     * @param username The unique identifier to save the data for.
     * @param data The data that we are saving.
     */

    private updateCollection(collection: Collection, username: string, data: unknown) {
        collection.updateOne(
            {
                username
            },
            { $set: data },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error occurred while saving ${collection.collectionName} for ${username}.`
                    );

                if (!result)
                    log.error(`Unable to save ${collection.collectionName} for ${username}.`);
            }
        );
    }

    /**
     * Serializes a player object and uses the bcrypt hashing to replace
     * the plaintext password with the hashed one. It creates a callback
     * of the player info with the hashed password.
     * @param player The player parameter to serialize.
     * @param callback Player info containing hashed password.
     */

    public getPlayerWithHash(player: Player, callback: (playerInfo: PlayerInfo) => void): void {
        let info = Creator.serializePlayer(player);

        Creator.hashPassword(player.password, (hashString: string) => {
            /**
             * Replace the plaintext password with the hashString we created.
             * This is the actual string that gets stored in the database and
             * is later compared to check login validity.
             */
            info.password = hashString;

            callback(info);
        });
    }

    /**
     * Takes a password in plaintext and makes a callback with the hashed version.
     * @param password The password plaintext we are trying to hash.
     * @param callback A callback with the hashed string.
     */

    private static hashPassword(password: string, callback: (hashString: string) => void): void {
        bcryptjs.hash(password, 10, (error: Error, hash: string) => {
            if (error) throw error;

            callback(hash);
        });
    }

    /**
     * Takes on a `player` parameter and extracts all the info in the
     * form of `PlayerInfo` interface. It essentially serializes the player
     * object to a dictionary format.
     */

    public static serializePlayer(player: Player): PlayerInfo {
        return {
            username: player.username,
            password: player.password,
            email: player.email,
            x: player.x,
            y: player.y,
            userAgent: player.userAgent,
            experience: player.experience,
            rights: player.rights,
            poison: player.poison,
            hitPoints: player.hitPoints.getHitPoints(),
            mana: player.mana.getMana(),
            pvpKills: player.pvpKills,
            pvpDeaths: player.pvpDeaths,
            orientation: player.orientation,
            ban: player.ban,
            mute: player.mute,
            lastLogin: player.lastLogin,
            lastWarp: player.warp.lastWarp,
            mapVersion: player.mapVersion
        };
    }

    // public save(player: Player): void {
    //     let data = this.database.collection<PlayerData>('player_data'),
    //         equipment = this.database.collection<PlayerEquipment>('player_equipment'),
    //         quests = this.database.collection<PlayerQuests>('player_quests'),
    //         achievements = this.database.collection<PlayerAchievements>('player_achievements'),
    //         bank = this.database.collection<ContainerArray>('player_bank'),
    //         regions = this.database.collection<PlayerRegions>('player_regions'),
    //         abilities = this.database.collection<AbilitiesArray>('player_abilities'),
    //         // friends = this.database.collection<FriendsArray>('player_friends'),
    //         inventory = this.database.collection<ContainerArray>('player_inventory');

    //     try {
    //         this.saveData(data, player);
    //         this.saveEquipment(equipment, player);
    //         this.saveQuests(quests, player);
    //         this.saveAchievements(achievements, player);
    //         this.saveBank(bank, player);
    //         this.saveRegions(regions, player);
    //         this.saveAbilities(abilities, player);
    //         // this.saveFriends(friends, player);
    //         this.saveInventory(inventory, player, () => {
    //             log.debug(`Successfully saved all data for player ${player.username}.`);
    //         });
    //     } catch {
    //         log.error(`Error while saving data for ${player.username}`);
    //     }
    // }

    // private saveData(collection: Collection<PlayerData>, player: Player): void {
    //     Creator.getPlayerData(player, (data) => {
    //         collection.updateOne(
    //             { username: player.username },
    //             { $set: data },
    //             { upsert: true },
    //             (error, result) => {
    //                 if (error)
    //                     log.error(
    //                         `An error has occurred while saving player_data for ${player.username}!`
    //                     );

    //                 if (!result) log.error(`Could not save player_data for ${player.username}!`);
    //             }
    //         );
    //     });
    // }

    // private saveEquipment(collection: Collection<PlayerEquipment>, player: Player): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         { $set: Creator.getPlayerEquipment(player) },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_equipment for ${player.username}!`
    //                 );

    //             if (!result) log.error(`Could not save player_equipment for ${player.username}!`);
    //         }
    //     );
    // }

    // private saveQuests(collection: Collection<PlayerQuests>, player: Player): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         { $set: player.quests.getQuests() },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_quests for ${player.username}!`
    //                 );

    //             if (!result) log.error(`Could not save player_quests for ${player.username}!`);
    //         }
    //     );
    // }

    // private saveAchievements(collection: Collection<PlayerAchievements>, player: Player): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         { $set: player.quests.getAchievements() },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_achievements for ${player.username}!`
    //                 );

    //             if (!result)
    //                 log.error(`Could not save player_achievements for ${player.username}!`);
    //         }
    //     );
    // }

    // private saveBank(collection: Collection<ContainerArray>, player: Player): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         { $set: player.bank.getArray() },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_bank for ${player.username}!`
    //                 );

    //             if (!result) log.error(`Could not save player_bank for ${player.username}!`);
    //         }
    //     );
    // }

    // private saveRegions(collection: Collection<PlayerRegions>, player: Player): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         {
    //             $set: {
    //                 regions: player.regionsLoaded.toString(),
    //                 gameVersion: config.gver
    //             }
    //         },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_regions for ${player.username}!`
    //                 );

    //             if (!result) log.error(`Could not save player_regions for ${player.username}!`);
    //         }
    //     );
    // }

    // private saveAbilities(collection: Collection<AbilitiesArray>, player: Player): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         { $set: player.abilities.getArray() },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_abilities for ${player.username}!`
    //                 );

    //             if (!result) log.error(`Could not save player_abilities for ${player.username}!`);
    //         }
    //     );
    // }

    // private saveFriends(collection: Collection<FriendsArray>, player: Player): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         { $set: player.friends.getArray() },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_friends for ${player.username}!`
    //                 );

    //             if (!result) log.error(`Could not save player_friends for ${player.username}!`);
    //         }
    //     );
    // }

    // private saveInventory(
    //     collection: Collection<ContainerArray>,
    //     player: Player,
    //     callback: () => void
    // ): void {
    //     collection.updateOne(
    //         { username: player.username },
    //         { $set: player.inventory.getArray() },
    //         { upsert: true },
    //         (error, result) => {
    //             if (error)
    //                 log.error(
    //                     `An error has occurred while saving player_inventory for ${player.username}!`
    //                 );

    //             if (!result) log.error(`Could not save player_inventory for ${player.username}!`);

    //             if (result) callback();
    //         }
    //     );
    // }

    // private static getPasswordHash(password: string, callback: (hash: string) => void): void {
    //     bcryptjs.hash(password, 10, (error, hash) => {
    //         if (error) throw error;

    //         callback(hash);
    //     });
    // }

    // private static getPlayerData(player: Player, callback: (data: PlayerData) => void): void {
    //     Creator.getPasswordHash(player.password, (hash) => {
    //         callback({
    //             username: player.username,
    //             password: hash,
    //             email: player.email,
    //             x: player.x,
    //             y: player.y,
    //             experience: player.experience,
    //             rights: player.rights,
    //             poison: player.poison,
    //             hitPoints: player.getHitPoints(),
    //             mana: player.getMana(),
    //             pvpKills: player.pvpKills,
    //             pvpDeaths: player.pvpDeaths,
    //             orientation: player.orientation,
    //             ban: player.ban,
    //             mute: player.mute,
    //             lastLogin: player.lastLogin,
    //             lastWarp: player.warp?.lastWarp,
    //             // guildName: player.guildName,
    //             userAgent: player.userAgent,
    //             mapVersion: player.mapVersion
    //         });
    //     });
    // }

    // private static getPlayerEquipment(player: Player): PlayerEquipment {
    //     return {
    //         username: player.username,
    //         armour: [
    //             player.armour?.getId() ?? 114,
    //             player.armour?.getCount() ?? -1,
    //             player.armour?.getAbility() ?? -1,
    //             player.armour?.getAbilityLevel() ?? -1
    //         ],
    //         weapon: [
    //             player.weapon?.getId() ?? -1,
    //             player.weapon?.getCount() ?? -1,
    //             player.weapon?.getAbility() ?? -1,
    //             player.weapon?.getAbilityLevel() ?? -1
    //         ],
    //         pendant: [
    //             player.pendant?.getId() ?? -1,
    //             player.pendant?.getCount() ?? -1,
    //             player.pendant?.getAbility() ?? -1,
    //             player.pendant?.getAbilityLevel() ?? -1
    //         ],
    //         ring: [
    //             player.ring?.getId() ?? -1,
    //             player.ring?.getCount() ?? -1,
    //             player.ring?.getAbility() ?? -1,
    //             player.ring?.getAbilityLevel() ?? -1
    //         ],
    //         boots: [
    //             player.boots?.getId() ?? -1,
    //             player.boots?.getCount() ?? -1,
    //             player.boots?.getAbility() ?? -1,
    //             player.boots?.getAbilityLevel() ?? -1
    //         ]
    //     };
    // }

    // /**
    //  * Crossed over from the MySQL database. This should be refined
    //  * fairly soon as it is just unnecessary code for speed development.
    //  * The above object arrays should just be concatenated.
    //  */
    // public static getFullData(player: Player): FullPlayerData {
    //     let position = player.getSpawn();

    //     return {
    //         username: player.username,
    //         password: player.password,
    //         email: player.email || 'null',
    //         x: position.x,
    //         y: position.y,
    //         rights: player.rights || 0,
    //         hitPoints: player.hitPoints.getHitPoints(),
    //         mana: player.mana.getMana(),
    //         poison: player.poison || null,
    //         experience: player.experience || 0,
    //         ban: player.ban || 0,
    //         mute: player.mute || 0,
    //         lastLogin: player.lastLogin || 0,
    //         pvpKills: player.pvpKills || 0,
    //         pvpDeaths: player.pvpDeaths || 0,
    //         orientation: player.orientation || 0,
    //         lastWarp: player.warp.lastWarp || 0,
    //         mapVersion: player.mapVersion || 0,
    //         armour: [
    //             player.armour?.getId() || 114,
    //             player.armour?.getCount() || -1,
    //             player.armour?.getAbility() || -1,
    //             player.armour?.getAbilityLevel() || -1
    //         ],
    //         weapon: [
    //             player.weapon?.getId() || -1,
    //             player.weapon?.getCount() || -1,
    //             player.weapon?.getAbility() || -1,
    //             player.weapon?.getAbilityLevel() || -1
    //         ],
    //         pendant: [
    //             player.pendant?.getId() || -1,
    //             player.pendant?.getCount() || -1,
    //             player.pendant?.getAbility() || -1,
    //             player.pendant?.getAbilityLevel() || -1
    //         ],
    //         ring: [
    //             player.ring?.getId() || -1,
    //             player.ring?.getCount() || -1,
    //             player.ring?.getAbility() || -1,
    //             player.ring?.getAbilityLevel() || -1
    //         ],
    //         boots: [
    //             player.boots?.getId() || -1,
    //             player.boots?.getCount() || -1,
    //             player.boots?.getAbility() || -1,
    //             player.boots?.getAbilityLevel() || -1
    //         ]
    //     } as FullPlayerData;
    // }
}
