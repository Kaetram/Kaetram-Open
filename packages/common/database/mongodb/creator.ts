import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import config from '@kaetram/common/config';

import type Player from '@kaetram/server/src/game/entity/character/player/player';
import type { Collection, Db } from 'mongodb';
import type { Modules } from '@kaetram/common/network';
import type { GuildData } from '@kaetram/common/network/impl/guild';
import type { SerializedEffects } from '@kaetram/common/types/status';

// Used for password reset
export interface ResetToken {
    token: string;
    expiration: number;
}

export interface PoisonInfo {
    type: number; // Type of poison.
    remaining: number; // How much of the poison is left.
}

export interface PlayerInfo {
    username: string;
    password: string;
    email: string;
    x: number;
    y: number;
    userAgent: string;
    rank: Modules.Ranks;
    poison: PoisonInfo;
    effects: SerializedEffects;
    hitPoints: number;
    mana: number;
    orientation: Modules.Orientation;
    ban: number;
    jail: number;
    mute: number;
    lastWarp: number;
    mapVersion: number;
    regionsLoaded: number[];
    friends: string[];
    lastServerId: number;
    lastAddress: string;
    lastGlobalChat: number;
    guild: string;
    pet: string;
    resetToken?: ResetToken;
}

/**
 * The creator database class is responsible for serializing information and storing
 * it into MongoDB. The primary idea is to store only the necessary data when serializing
 * and avoiding redundancies.
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
            this.saveInventory(player);
            this.saveBank(player);
            this.saveQuests(player);
            this.saveAchievements(player);
            this.saveSkills(player);
            this.saveStatistics(player);
            this.saveAbilities(player);
        } catch (error: unknown) {
            log.error(`Could not save data for ${player.username}.`);
            log.error(error);
        }
    }

    /**
     * Saves the basic variable information about the player.
     * See `PlayerInfo` for more information.
     */

    private saveInfo(player: Player): void {
        let collection = this.database.collection('player_info');

        this.getPlayerWithHash(player, (playerInfo: PlayerInfo) => {
            this.updateCollection(collection, player.username, playerInfo);
        });
    }

    /**
     * Serializes the equipment data of the player and
     * stores it into the database.
     */

    private saveEquipment(player: Player): void {
        let collection = this.database.collection('player_equipment');

        // Pass the serialized equipment as parameter.
        this.updateCollection(collection, player.username, player.equipment.serialize());
    }

    /**
     * Serializes the inventory information and
     * stores it into the database.
     */

    private saveInventory(player: Player): void {
        let collection = this.database.collection('player_inventory');

        this.updateCollection(collection, player.username, player.inventory.serialize());
    }

    /**
     * Serializes the bank information and
     * stores it into the database.
     */

    private saveBank(player: Player): void {
        let collection = this.database.collection('player_bank');

        this.updateCollection(collection, player.username, player.bank.serialize());
    }

    /**
     * Serializes the quest data and stores it in the database.
     */

    private saveQuests(player: Player): void {
        let collection = this.database.collection('player_quests');

        this.updateCollection(collection, player.username, player.quests.serialize());
    }

    /**
     * Serializes the achievement data and stores it into the database.
     */

    private saveAchievements(player: Player): void {
        let collection = this.database.collection('player_achievements');

        this.updateCollection(collection, player.username, player.achievements.serialize());
    }

    /**
     * Serializes all the skills and stores the data into the database.
     */

    private saveSkills(player: Player): void {
        let collection = this.database.collection('player_skills');

        this.updateCollection(collection, player.username, player.skills.serialize());
    }

    /**
     * Serializes the player's statistics and stores it into the database.
     */

    private saveStatistics(player: Player): void {
        let collection = this.database.collection('player_statistics');

        this.updateCollection(collection, player.username, player.statistics.serialize());
    }

    /**
     * Serializes the player's abilities and stores them into the database.
     */

    private saveAbilities(player: Player): void {
        let collection = this.database.collection('player_abilities');

        this.updateCollection(collection, player.username, player.abilities.serialize());
    }

    /**
     * Saves the guild to the guild collection.
     * @param guild Contains the data about the guild we are saving.
     * @param callback The callback function to execute after saving.
     */

    public saveGuild(guild: GuildData, callback?: () => void): void {
        let collection = this.database.collection('guilds');

        collection
            .updateOne({ identifier: guild.identifier }, { $set: guild }, { upsert: true })
            .then((result) => {
                if (!result) log.error(`Unable to save guild ${guild.name}.`);

                callback?.();
            })
            .catch((error) => {
                log.error(`An error occurred while saving guild ${guild.name}.`);
                log.error(error);
            });
    }

    /**
     * The brains of the operation for storing/updating data to MongoDB.
     * We provide the collection, username, data.
     * and we save all that information into the database.
     * @param collection The collection we are saving to (e.g. player_info, player_equipment, etc.)
     * @param username The unique identifier to save the data for.
     * @param data The data that we are saving.
     */

    private updateCollection<S>(collection: Collection, username: string, data: S) {
        collection
            .updateOne({ username }, { $set: data }, { upsert: true })
            .then((result) => {
                if (!result)
                    log.error(`Unable to save ${collection.collectionName} for ${username}.`);
            })
            .catch((error) => {
                log.error(
                    `An error occurred while saving ${collection.collectionName} for ${username}.`
                );
                log.error(error);
            });
    }

    /**
     * Serializes a player object and uses the bcrypt hashing to replace
     * the plaintext password with the hashed one. It creates a callback
     * of the player info with the hashed password.
     * @param player The player parameter to serialize.
     * @param callback Player info containing hashed password.
     */

    public getPlayerWithHash(player: Player, callback: (playerInfo: PlayerInfo) => void): void {
        let info = Creator.serialize(player);

        Utils.hash(player.password, (hash: string) => {
            /**
             * Replace the plaintext password with the hashString we created.
             * This is the actual string that gets stored in the database and
             * is later compared to check login validity.
             */
            info.password = hash;

            callback(info);
        });
    }

    /**
     * Verifies the user's username, password, and email server-sided
     * to make sure the registration process does not encounter issues.
     * @param player The player instance we are verifying.
     */

    public static verifyPlayer(player: Player): boolean {
        if (!Utils.isValidUsername(player.username)) return false;
        if (!player.username || player.username.length === 0) return false;
        if (!player.password || player.password.length < 3 || player.password.length > 64)
            return false;
        if (!Utils.isEmail(player.email)) return false;

        return true;
    }

    /**
     * Serializes a player object and extracts all the basic information
     * that will be saved in the database. This is generally used for
     * loading the player and sending the preliminary information to the client.
     * @param player The player object that we want to serialize.
     * @returns A serialized object that contains the player's information, we use
     * this and store it in the database.
     */

    public static serialize(player: Player): PlayerInfo {
        return {
            username: player.username,
            password: player.password,
            email: player.email,
            x: player.x,
            y: player.y,
            userAgent: player.userAgent,
            rank: player.rank,
            poison: {
                type: player.poison ? player.poison.type : -1,
                remaining: player.poison ? player.poison.getRemainingTime() : -1
            },
            effects: player.status.serialize(),
            hitPoints: player.hitPoints.getHitPoints(),
            mana: player.mana.getMana(),
            orientation: player.orientation,
            ban: player.ban,
            mute: player.mute,
            jail: player.jail,
            lastWarp: player.lastWarp,
            mapVersion: player.mapVersion,
            regionsLoaded: player.regionsLoaded,
            friends: player.friends.serialize(),
            lastServerId: config.serverId,
            lastAddress: player.connection.address,
            lastGlobalChat: player.lastGlobalChat,
            guild: player.guild,
            pet: player.pet ? player.pet.key : '',
            resetToken: undefined // Save token as undefined to prevent it from being saved.
        };
    }
}
