"use strict";
exports.__esModule = true;
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
var Loader = /** @class */ (function () {
    /**
     * Creates an instance of Loader.
     * @param database - The database client.
     */
    function Loader(database) {
        this.database = database;
    }
    Loader.prototype.getInventory = function (player, callback) {
        this.database.getDatabase(function (database) {
            var inventory = database.collection('player_inventory');
            var cursor = inventory.find({ username: player.username });
            cursor.toArray().then(function (inventoryArray) {
                var info = inventoryArray[0];
                if (info) {
                    if (info.username !== player.username)
                        console.info("[Loader] Mismatch in usernames whilst retrieving inventory data for: " + player.username);
                    callback(info.ids.split(' '), info.counts.split(' '), info.abilities.split(' '), info.abilityLevels.split(' '));
                }
                else
                    callback(null, null, null, null);
            });
        });
    };
    Loader.prototype.getBank = function (player, callback) {
        this.database.getDatabase(function (database) {
            var bank = database.collection('player_bank');
            var cursor = bank.find({ username: player.username });
            cursor.toArray().then(function (bankArray) {
                var info = bankArray[0];
                if (info) {
                    if (info.username !== player.username)
                        console.info("[Loader] Mismatch in usernames whilst retrieving bank data for: " + player.username);
                    callback(info.ids.split(' '), info.counts.split(' '), info.abilities.split(' '), info.abilityLevels.split(' '));
                }
            });
        });
    };
    Loader.prototype.getQuests = function (player, callback) {
        this.database.getDatabase(function (database) {
            var quests = database.collection('player_quests');
            var cursor = quests.find({ username: player.username });
            cursor.toArray().then(function (questArray) {
                var info = questArray[0];
                if (info) {
                    if (info.username !== player.username)
                        console.info("[Loader] Mismatch in usernames whilst retrieving quest data for: " + player.username);
                    callback(info.ids.split(' '), info.stages.split(' '));
                }
                else
                    callback(null, null);
            });
        });
    };
    Loader.prototype.getAchievements = function (player, callback) {
        this.database.getDatabase(function (database) {
            var achievements = database.collection('player_achievements');
            var cursor = achievements.find({ username: player.username });
            cursor.toArray().then(function (achievementsArray) {
                var info = achievementsArray[0];
                if (info) {
                    if (info.username !== player.username)
                        console.info("[Loader] Mismatch in usernames whilst retrieving achievement data for: " + player.username);
                    callback(info.ids.split(' '), info.progress.split(' '));
                }
            });
        });
    };
    Loader.prototype.getGuilds = function (callback, returnCollection) {
        this.database.getDatabase(function (database) {
            var guilds = database.collection('guild_data');
            var cursor = guilds.find();
            cursor.toArray().then(function (guildsList) {
                callback(guildsList, returnCollection ? guilds : null);
            });
        });
    };
    Loader.prototype.getGuild = function (name, callback) {
        this.database.getDatabase(function (database) {
            var guilds = database.collection('guild_data');
            var cursor = guilds.find({ name: name.toLowerCase() });
            cursor.toArray().then(function (guildsArray) {
                var info = guildsArray[0];
                if (!info) {
                    callback(null);
                    return;
                }
                if (info.name !== name)
                    console.info("[Loader] Mismatch whilst retrieving guild data for " + name);
                callback({
                    name: info.name,
                    owner: info.owner,
                    members: info.members
                });
            });
        });
    };
    Loader.prototype.guildExists = function (name, callback) {
        this.database.getDatabase(function (database) {
            var guilds = database.collection('guild_data');
            var cursor = guilds.find({ name: name.toLowerCase() });
            cursor.toArray().then(function (data) {
                callback(data.length === 0);
            });
        });
    };
    return Loader;
}());
exports["default"] = Loader;
