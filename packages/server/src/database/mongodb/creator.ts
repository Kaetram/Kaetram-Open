import bcryptjs from 'bcryptjs';

import config from '@kaetram/common/config';
import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import type { Collection } from 'mongodb';
import type { PlayerAchievements, PlayerQuests } from '../../controllers/quests';
import type { AbilitiesArray } from '../../game/entity/character/player/abilities/abilities';
import type { ContainerArray } from '../../game/entity/character/player/containers/container';
import type { FriendsArray } from '../../game/entity/character/player/friends';
import type Player from '../../game/entity/character/player/player';
import type { PlayerEquipment, PlayerRegions } from '../../game/entity/character/player/player';
import type { ProfessionsArray } from '../../game/entity/character/player/professions/professions';
import type MongoDB from './mongodb';

interface PlayerData {
    username: string;
    password: string;
    email: string;
    x: number;
    y: number;
    userAgent: string;
    invisibleIds?: string;
    experience: number;
    rights: number;
    poison: string | null;
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

export type FullPlayerData = PlayerData & PlayerEquipment;

export default class Creator {
    public constructor(private database: MongoDB) {}

    public save(player: Player): void {
        this.database.getConnection((database) => {
            /* Handle the player databases */

            let data = database.collection<PlayerData>('player_data'),
                equipment = database.collection<PlayerEquipment>('player_equipment'),
                quests = database.collection<PlayerQuests>('player_quests'),
                achievements = database.collection<PlayerAchievements>('player_achievements'),
                bank = database.collection<ContainerArray>('player_bank'),
                regions = database.collection<PlayerRegions>('player_regions'),
                abilities = database.collection<AbilitiesArray>('player_abilities'),
                professions = database.collection<ProfessionsArray>('player_professions'),
                // friends = database.collection<FriendsArray>('player_friends'),
                inventory = database.collection<ContainerArray>('player_inventory');

            try {
                this.saveData(data, player);
                this.saveEquipment(equipment, player);
                this.saveQuests(quests, player);
                this.saveAchievements(achievements, player);
                this.saveBank(bank, player);
                this.saveRegions(regions, player);
                this.saveAbilities(abilities, player);
                this.saveProfessions(professions, player);
                // this.saveFriends(friends, player);
                this.saveInventory(inventory, player, () => {
                    log.debug(`Successfully saved all data for player ${player.username}.`);
                });
            } catch {
                log.error(`Error while saving data for ${player.username}`);
            }
        });
    }

    private saveData(collection: Collection<PlayerData>, player: Player): void {
        Creator.getPlayerData(player, (data) => {
            collection.updateOne(
                { username: player.username },
                { $set: data },
                { upsert: true },
                (error, result) => {
                    if (error)
                        log.error(
                            `An error has occurred while saving player_data for ${player.username}!`
                        );

                    if (!result) log.error(`Could not save player_data for ${player.username}!`);
                }
            );
        });
    }

    private saveEquipment(collection: Collection<PlayerEquipment>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            { $set: Creator.getPlayerEquipment(player) },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_equipment for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_equipment for ${player.username}!`);
            }
        );
    }

    private saveQuests(collection: Collection<PlayerQuests>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            { $set: player.quests.getQuests() },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_quests for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_quests for ${player.username}!`);
            }
        );
    }

    private saveAchievements(collection: Collection<PlayerAchievements>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            { $set: player.quests.getAchievements() },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_achievements for ${player.username}!`
                    );

                if (!result)
                    log.error(`Could not save player_achievements for ${player.username}!`);
            }
        );
    }

    private saveBank(collection: Collection<ContainerArray>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            { $set: player.bank.getArray() },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_bank for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_bank for ${player.username}!`);
            }
        );
    }

    private saveRegions(collection: Collection<PlayerRegions>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            {
                $set: {
                    regions: player.regionsLoaded.toString(),
                    gameVersion: config.gver
                }
            },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_regions for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_regions for ${player.username}!`);
            }
        );
    }

    private saveAbilities(collection: Collection<AbilitiesArray>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            { $set: player.abilities.getArray() },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_abilities for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_abilities for ${player.username}!`);
            }
        );
    }

    private saveProfessions(collection: Collection<ProfessionsArray>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            { $set: player.professions.getArray() },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_professions for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_professions for ${player.username}!`);
            }
        );
    }

    private saveFriends(collection: Collection<FriendsArray>, player: Player): void {
        collection.updateOne(
            { username: player.username },
            { $set: player.friends.getArray() },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_friends for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_friends for ${player.username}!`);
            }
        );
    }

    private saveInventory(
        collection: Collection<ContainerArray>,
        player: Player,
        callback: () => void
    ): void {
        collection.updateOne(
            { username: player.username },
            { $set: player.inventory.getArray() },
            { upsert: true },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_inventory for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_inventory for ${player.username}!`);

                if (result) callback();
            }
        );
    }

    private static getPasswordHash(password: string, callback: (hash: string) => void): void {
        bcryptjs.hash(password, 10, (error, hash) => {
            if (error) throw error;

            callback(hash);
        });
    }

    private static getPlayerData(player: Player, callback: (data: PlayerData) => void): void {
        Creator.getPasswordHash(player.password, (hash) => {
            callback({
                username: player.username,
                password: hash,
                email: player.email,
                x: player.x,
                y: player.y,
                experience: player.experience,
                rights: player.rights,
                poison: player.poison,
                hitPoints: player.getHitPoints(),
                mana: player.getMana(),
                pvpKills: player.pvpKills,
                pvpDeaths: player.pvpDeaths,
                orientation: player.orientation,
                ban: player.ban,
                mute: player.mute,
                lastLogin: player.lastLogin,
                lastWarp: player.warp?.lastWarp,
                // guildName: player.guildName,
                invisibleIds: player.formatInvisibles(),
                userAgent: player.userAgent,
                mapVersion: player.mapVersion
            });
        });
    }

    private static getPlayerEquipment(player: Player): PlayerEquipment {
        return {
            username: player.username,
            armour: [
                player.armour?.getId() ?? 114,
                player.armour?.getCount() ?? -1,
                player.armour?.getAbility() ?? -1,
                player.armour?.getAbilityLevel() ?? -1
            ],
            weapon: [
                player.weapon?.getId() ?? -1,
                player.weapon?.getCount() ?? -1,
                player.weapon?.getAbility() ?? -1,
                player.weapon?.getAbilityLevel() ?? -1
            ],
            pendant: [
                player.pendant?.getId() ?? -1,
                player.pendant?.getCount() ?? -1,
                player.pendant?.getAbility() ?? -1,
                player.pendant?.getAbilityLevel() ?? -1
            ],
            ring: [
                player.ring?.getId() ?? -1,
                player.ring?.getCount() ?? -1,
                player.ring?.getAbility() ?? -1,
                player.ring?.getAbilityLevel() ?? -1
            ],
            boots: [
                player.boots?.getId() ?? -1,
                player.boots?.getCount() ?? -1,
                player.boots?.getAbility() ?? -1,
                player.boots?.getAbilityLevel() ?? -1
            ]
        };
    }

    /**
     * Crossed over from the MySQL database. This should be refined
     * fairly soon as it is just unnecessary code for speed development.
     * The above object arrays should just be concatenated.
     */
    public static getFullData(player: Player): FullPlayerData {
        let position = player.getSpawn();

        return {
            username: player.username,
            password: player.password,
            email: player.email || 'null',
            x: position.x,
            y: position.y,
            rights: player.rights || 0,
            hitPoints: player.playerHitPoints?.getHitPoints() || 130,
            mana: player.mana?.getMana() || 18,
            poison: player.poison || null,
            experience: player.experience || 0,
            ban: player.ban || 0,
            mute: player.mute || 0,
            lastLogin: player.lastLogin || 0,
            pvpKills: player.pvpKills || 0,
            pvpDeaths: player.pvpDeaths || 0,
            orientation: player.orientation || 0,
            lastWarp: player.warp.lastWarp || 0,
            mapVersion: player.mapVersion || 0,
            armour: [
                player.armour?.getId() || 114,
                player.armour?.getCount() || -1,
                player.armour?.getAbility() || -1,
                player.armour?.getAbilityLevel() || -1
            ],
            weapon: [
                player.weapon?.getId() || -1,
                player.weapon?.getCount() || -1,
                player.weapon?.getAbility() || -1,
                player.weapon?.getAbilityLevel() || -1
            ],
            pendant: [
                player.pendant?.getId() || -1,
                player.pendant?.getCount() || -1,
                player.pendant?.getAbility() || -1,
                player.pendant?.getAbilityLevel() || -1
            ],
            ring: [
                player.ring?.getId() || -1,
                player.ring?.getCount() || -1,
                player.ring?.getAbility() || -1,
                player.ring?.getAbilityLevel() || -1
            ],
            boots: [
                player.boots?.getId() || -1,
                player.boots?.getCount() || -1,
                player.boots?.getAbility() || -1,
                player.boots?.getAbilityLevel() || -1
            ]
        } as FullPlayerData;
    }
}
