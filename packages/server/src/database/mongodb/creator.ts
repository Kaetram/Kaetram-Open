import bcryptjs from 'bcryptjs';
import MongoDB from './mongodb';
import log from '../../util/log';
import config from '../../../config';
import Player from '../../game/entity/character/player/player';

class Creator {
    database: MongoDB;

    constructor(database) {
        this.database = database;
    }

    save(player: Player): void {
        this.database.getConnection((database) => {
            /* Handle the player databases */

            let playerData = database.collection('player_data'),
                playerEquipment = database.collection('player_equipment'),
                playerQuests = database.collection('player_quests'),
                playerAchievements = database.collection('player_achievements'),
                playerBank = database.collection('player_bank'),
                playerRegions = database.collection('player_regions'),
                playerAbilities = database.collection('player_abilities'),
                playerProfessions = database.collection('player_professions'),
                //playerFriends = database.collection('player_friends'),
                playerInventory = database.collection('player_inventory');

            try {
                this.saveData(playerData, player);
                this.saveEquipment(playerEquipment, player);
                this.saveQuests(playerQuests, player);
                this.saveAchievements(playerAchievements, player);
                this.saveBank(playerBank, player);
                this.saveRegions(playerRegions, player);
                this.saveAbilities(playerAbilities, player);
                this.saveProfessions(playerProfessions, player);
                //this.saveFriends(playerFriends, player);
                this.saveInventory(playerInventory, player, () => {
                    log.debug(`Successfully saved all data for player ${player.username}.`);
                });
            } catch (e) {
                log.error(`Error while saving data for ${player.username}`);
            }
        });
    }

    saveData(collection, player: Player): void {
        Creator.getPlayerData(player, (data) => {
            collection.updateOne(
                {
                    username: player.username
                },
                { $set: data },
                {
                    upsert: true
                },
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

    saveEquipment(collection, player: Player): void {
        collection.updateOne(
            {
                username: player.username
            },
            { $set: Creator.getPlayerEquipment(player) },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_equipment for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_equipment for ${player.username}!`);
            }
        );
    }

    saveQuests(collection, player: Player): void {
        collection.updateOne(
            {
                username: player.username
            },
            { $set: player.quests.getQuests() },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_quests for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_quests for ${player.username}!`);
            }
        );
    }

    saveAchievements(collection, player: Player): void {
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

    saveBank(collection, player: Player): void {
        collection.updateOne(
            {
                username: player.username
            },
            { $set: player.bank.getArray() },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_bank for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_bank for ${player.username}!`);
            }
        );
    }

    saveRegions(collection, player: Player): void {
        collection.updateOne(
            {
                username: player.username
            },
            {
                $set: {
                    regions: player.regionsLoaded.toString(),
                    gameVersion: config.gver
                }
            },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_regions for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_regions for ${player.username}!`);
            }
        );
    }

    saveAbilities(collection, player: Player): void {
        collection.updateOne(
            {
                username: player.username
            },
            { $set: player.abilities.getArray() },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_abilities for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_abilities for ${player.username}!`);
            }
        );
    }

    saveProfessions(collection, player: Player): void {
        collection.updateOne(
            {
                username: player.username
            },
            { $set: player.professions.getArray() },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_professions for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_professions for ${player.username}!`);
            }
        );
    }

    saveFriends(collection, player: Player): void {
        collection.updateOne(
            {
                username: player.username
            },
            { $set: player.friends.getArray() },
            {
                upsert: true
            },
            (error, result) => {
                if (error)
                    log.error(
                        `An error has occurred while saving player_friends for ${player.username}!`
                    );

                if (!result) log.error(`Could not save player_friends for ${player.username}!`);
            }
        );
    }

    saveInventory(collection, player, callback) {
        collection.updateOne(
            {
                username: player.username
            },
            { $set: player.inventory.getArray() },
            {
                upsert: true
            },
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

    static getPasswordHash(password: string, callback: (hash: string) => void): void {
        bcryptjs.hash(password, 10, (error: any, hash: string) => {
            if (error) throw error;

            callback(hash);
        });
    }

    static getPlayerData(player: Player, callback: (data: any) => void): void {
        Creator.getPasswordHash(player.password, (hash: string) => {
            callback({
                username: player.username,
                password: hash,
                email: player.email,
                x: player.x,
                y: player.y,
                experience: player.experience,
                kind: player.kind,
                rights: player.rights,
                poison: player.poison,
                hitPoints: player.getHitPoints(),
                mana: player.getMana(),
                pvpKills: player.pvpKills,
                pvpDeaths: player.pvpDeaths,
                orientation: player.orientation,
                ban: player.ban,
                mute: player.mute,
                membership: player.membership,
                lastLogin: player.lastLogin,
                lastWarp: player.warp?.lastWarp,
                //guildName: player.guildName,
                invisibleIds: player.formatInvisibles(),
                userAgent: player.userAgent,
                mapVersion: player.mapVersion
            });
        });
    }

    static getPlayerEquipment(player: Player): any {
        return {
            username: player.username,
            armour: [
                player.armour ? player.armour.getId() : 114,
                player.armour ? player.armour.getCount() : -1,
                player.armour ? player.armour.getAbility() : -1,
                player.armour ? player.armour.getAbilityLevel() : -1
            ],
            weapon: [
                player.weapon ? player.weapon.getId() : -1,
                player.weapon ? player.weapon.getCount() : -1,
                player.weapon ? player.weapon.getAbility() : -1,
                player.weapon ? player.weapon.getAbilityLevel() : -1
            ],
            pendant: [
                player.pendant ? player.pendant.getId() : -1,
                player.pendant ? player.pendant.getCount() : -1,
                player.pendant ? player.pendant.getAbility() : -1,
                player.pendant ? player.pendant.getAbilityLevel() : -1
            ],
            ring: [
                player.ring ? player.ring.getId() : -1,
                player.ring ? player.ring.getCount() : -1,
                player.ring ? player.ring.getAbility() : -1,
                player.ring ? player.ring.getAbilityLevel() : -1
            ],
            boots: [
                player.boots ? player.boots.getId() : -1,
                player.boots ? player.boots.getCount() : -1,
                player.boots ? player.boots.getAbility() : -1,
                player.boots ? player.boots.getAbilityLevel() : -1
            ]
        };
    }

    /**
     * Crossed over from the MySQL database. This should be refined
     * fairly soon as it is just unnecessary code for speed development.
     * The above object arrays should just be concatenated.
     */

    static getFullData(player: Player): any {
        let position = player.getSpawn();

        return {
            username: player.username,
            password: player.password,
            email: player.email ? player.email : 'null',
            x: position.x,
            y: position.y,
            kind: player.kind ? player.kind : 0,
            rights: player.rights ? player.rights : 0,
            hitPoints: player.hitPoints ? player.hitPoints : 100,
            mana: player.mana ? player.mana : 20,
            poison: player.poison ? player.poison : 0,
            experience: player.experience ? player.experience : 0,
            ban: player.ban ? player.ban : 0,
            mute: player.mute ? player.mute : 0,
            membership: player.membership ? player.membership : 0,
            lastLogin: player.lastLogin ? player.lastLogin : 0,
            pvpKills: player.pvpKills ? player.pvpKills : 0,
            pvpDeaths: player.pvpDeaths ? player.pvpDeaths : 0,
            orientation: player.orientation ? player.orientation : 0,
            lastWarp: player.warp.lastWarp ? player.warp.lastWarp : 0,
            mapVersion: player.mapVersion ? player.mapVersion : 0,
            armour: [
                player.armour ? player.armour.getId() : 114,
                player.armour ? player.armour.getCount() : -1,
                player.armour ? player.armour.getAbility() : -1,
                player.armour ? player.armour.getAbilityLevel() : -1
            ],
            weapon: [
                player.weapon ? player.weapon.getId() : -1,
                player.weapon ? player.weapon.getCount() : -1,
                player.weapon ? player.weapon.getAbility() : -1,
                player.weapon ? player.weapon.getAbilityLevel() : -1
            ],
            pendant: [
                player.pendant ? player.pendant.getId() : -1,
                player.pendant ? player.pendant.getCount() : -1,
                player.pendant ? player.pendant.getAbility() : -1,
                player.pendant ? player.pendant.getAbilityLevel() : -1
            ],
            ring: [
                player.ring ? player.ring.getId() : -1,
                player.ring ? player.ring.getCount() : -1,
                player.ring ? player.ring.getAbility() : -1,
                player.ring ? player.ring.getAbilityLevel() : -1
            ],
            boots: [
                player.boots ? player.boots.getId() : -1,
                player.boots ? player.boots.getCount() : -1,
                player.boots ? player.boots.getAbility() : -1,
                player.boots ? player.boots.getAbilityLevel() : -1
            ]
        };
    }
}

export default Creator;
