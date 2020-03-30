import MongoDB from './mongodb';
import Player from '../../game/entity/character/player/player';

/**
 * Loads player data from the database.
 *
 * @remarks
 * Loads player content from the database such as:
 * - Inventory
 * - Bank
 * - Quests
 * - Achievements
 * - Guild(s)
 */
class Loader {
    /**
     * Creates an instance of Loader.
     * @param database - The database client.
     */
    constructor(public database: MongoDB) {}

    getInventory(
        player: Player,
        callback: (arg0: any, arg1: any, arg2: any, arg3: any) => void
    ) {
        this.database.getDatabase((database) => {
            const inventory = database.collection('player_inventory');
            const cursor = inventory.find({ username: player.username });

            cursor.toArray().then((inventoryArray) => {
                const info = inventoryArray[0];

                if (info) {
                    if (info.username !== player.username)
                        console.info(
                            `[Loader] Mismatch in usernames whilst retrieving inventory data for: ${player.username}`
                        );

                    callback(
                        info.ids.split(' '),
                        info.counts.split(' '),
                        info.abilities.split(' '),
                        info.abilityLevels.split(' ')
                    );
                } else callback(null, null, null, null);
            });
        });
    }

    getBank(player, callback) {
        this.database.getDatabase((database) => {
            const bank = database.collection('player_bank');
            const cursor = bank.find({ username: player.username });

            cursor.toArray().then((bankArray) => {
                const info = bankArray[0];

                if (info) {
                    if (info.username !== player.username)
                        console.info(
                            `[Loader] Mismatch in usernames whilst retrieving bank data for: ${player.username}`
                        );

                    callback(
                        info.ids.split(' '),
                        info.counts.split(' '),
                        info.abilities.split(' '),
                        info.abilityLevels.split(' ')
                    );
                }
            });
        });
    }

    getQuests(player, callback) {
        this.database.getDatabase((database) => {
            const quests = database.collection('player_quests');
            const cursor = quests.find({ username: player.username });

            cursor.toArray().then((questArray) => {
                const info = questArray[0];

                if (info) {
                    if (info.username !== player.username)
                        console.info(
                            `[Loader] Mismatch in usernames whilst retrieving quest data for: ${player.username}`
                        );

                    callback(info.ids.split(' '), info.stages.split(' '));
                } else callback(null, null);
            });
        });
    }

    getAchievements(player, callback) {
        this.database.getDatabase((database) => {
            const achievements = database.collection('player_achievements');
            const cursor = achievements.find({ username: player.username });

            cursor.toArray().then((achievementsArray) => {
                const info = achievementsArray[0];

                if (info) {
                    if (info.username !== player.username)
                        console.info(
                            `[Loader] Mismatch in usernames whilst retrieving achievement data for: ${player.username}`
                        );

                    callback(info.ids.split(' '), info.progress.split(' '));
                }
            });
        });
    }

    getGuilds(callback, returnCollection) {
        this.database.getDatabase((database) => {
            const guilds = database.collection('guild_data');
            const cursor = guilds.find();

            cursor.toArray().then((guildsList) => {
                callback(guildsList, returnCollection ? guilds : null);
            });
        });
    }

    getGuild(name, callback) {
        this.database.getDatabase((database) => {
            const guilds = database.collection('guild_data');
            const cursor = guilds.find({ name: name.toLowerCase() });

            cursor.toArray().then((guildsArray) => {
                const info = guildsArray[0];

                if (!info) {
                    callback(null);

                    return;
                }

                if (info.name !== name)
                    console.info(
                        `[Loader] Mismatch whilst retrieving guild data for ${name}`
                    );

                callback({
                    name: info.name,
                    owner: info.owner,
                    members: info.members
                });
            });
        });
    }

    guildExists(name, callback) {
        this.database.getDatabase((database) => {
            const guilds = database.collection('guild_data');
            const cursor = guilds.find({ name: name.toLowerCase() });

            cursor.toArray().then((data) => {
                callback(data.length === 0);
            });
        });
    }
}

export default Loader;
