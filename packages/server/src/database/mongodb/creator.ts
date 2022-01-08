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
            this.saveInventory(player);
            this.saveBank(player);
        } catch (error: unknown) {
            log.error(`Could not save data for ${player.username}.`);
            log.error(error);
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
     * Serializes the inventory information and
     * stores it into the database.
     */

    public saveInventory(player: Player): void {
        let collection = this.database.collection('player_inventory');

        this.updateCollection(collection, player.username, player.inventory.serialize());
    }

    /**
     * Serializes the bank information and
     * stores it into the database.
     */

    public saveBank(player: Player): void {
        let collection = this.database.collection('player_bank');

        this.updateCollection(collection, player.username, player.bank.serialize());
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
        collection.updateOne({ username }, { $set: data }, { upsert: true }, (error, result) => {
            if (error)
                log.error(
                    `An error occurred while saving ${collection.collectionName} for ${username}.`
                );

            if (!result) log.error(`Unable to save ${collection.collectionName} for ${username}.`);
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
}
