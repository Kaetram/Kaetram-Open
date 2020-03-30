"use strict";
exports.__esModule = true;
var bcrypt = require("bcrypt");
var config_1 = require("../../../config");
/**
 * Creates, saves, and loads player data from the database.
 */
var Creator = /** @class */ (function () {
    /**
     * Creates an instance of this.
     * @param database - The database client.
     */
    function Creator(database) {
        this.database = database;
        this.database = database;
    }
    Creator.prototype.save = function (player) {
        var _this = this;
        this.database.getDatabase(function (database) {
            /* Handle the player databases */
            var playerData = database.collection('player_data');
            var playerEquipment = database.collection('player_equipment');
            var playerQuests = database.collection('player_quests');
            var playerAchievements = database.collection('player_achievements');
            var playerBank = database.collection('player_bank');
            var playerRegions = database.collection('player_regions');
            var playerAbilities = database.collection('player_abilities');
            var playerInventory = database.collection('player_inventory');
            _this.savePlayerData(playerData, player);
            _this.savePlayerEquipment(playerEquipment, player);
            _this.savePlayerQuests(playerQuests, player);
            _this.savePlayerAchievements(playerAchievements, player);
            _this.savePlayerBank(playerBank, player);
            _this.savePlayerRegions(playerRegions, player);
            _this.savePlayerAbilities(playerAbilities, player);
            _this.savePlayerInventory(playerInventory, player, function () {
                database.close();
            });
        });
    };
    Creator.prototype.savePlayerData = function (collection, player) {
        this.getPlayerData(player, function (data) {
            collection.updateOne({
                username: player.username
            }, { $set: data }, {
                upsert: true
            }, function (error, result) {
                if (error)
                    throw error;
                if (result)
                    console.debug("Player " + player.username + " data has been saved successfully.");
            });
        });
    };
    Creator.prototype.savePlayerEquipment = function (collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: this.getPlayerEquipment(player) }, {
            upsert: true
        }, function (error, result) {
            if (error)
                throw error;
            if (result)
                console.debug("Player " + player.username + " equipment data has been saved successfully.");
        });
    };
    Creator.prototype.savePlayerQuests = function (collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.quests.getQuests() }, {
            upsert: true
        }, function (error, result) {
            if (error)
                throw error;
            if (result)
                console.debug("Player " + player.username + " quest data has been saved successfully.");
        });
    };
    Creator.prototype.savePlayerAchievements = function (collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.quests.getAchievements() }, {
            upsert: true
        }, function (error, result) {
            if (error)
                throw error;
            if (result)
                console.debug("Player " + player.username + " achievement data has been saved successfully.");
        });
    };
    Creator.prototype.savePlayerBank = function (collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.bank.getArray() }, {
            upsert: true
        }, function (error, result) {
            if (error)
                throw error;
            if (result)
                console.debug("Player " + player.username + " bank data has been saved successfully.");
        });
    };
    Creator.prototype.savePlayerRegions = function (collection, player) {
        collection.updateOne({
            username: player.username
        }, {
            $set: {
                regions: player.regionsLoaded.toString(),
                gameVersion: config_1["default"].gver
            }
        }, {
            upsert: true
        }, function (error, result) {
            if (error)
                throw error;
            if (result)
                console.debug("Player " + player.username + " regions data has been saved successfully.");
        });
    };
    Creator.prototype.savePlayerAbilities = function (collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.abilities.getArray() }, {
            upsert: true
        }, function (error, result) {
            if (error)
                throw error;
            if (result)
                console.debug("Player " + player.username + " abilities data has been saved successfully.");
        });
    };
    Creator.prototype.savePlayerInventory = function (collection, player, callback) {
        collection.updateOne({
            username: player.username
        }, { $set: player.inventory.getArray() }, {
            upsert: true
        }, function (error, result) {
            if (error)
                throw error;
            if (result)
                console.debug("Player " + player.username + " inventory data has been saved successfully.");
        });
    };
    Creator.prototype.saveGuild = function (guild) {
        var data = {
            name: guild.name,
            owner: guild.owner,
            members: guild.members
        };
        if (!data.name || !data.owner || !data.members)
            return;
        this.database.getDatabase(function (database) {
            var guilds = database.collection('guild_data');
            guilds.updateOne({
                name: guild.name.toLowerCase()
            }, { $set: data }, {
                upsert: true
            }, function (error, result) {
                if (error)
                    throw error;
                if (result)
                    console.debug("Successfully saved data for " + guild.name + "'s guild.");
            });
        });
    };
    Creator.prototype.getPasswordHash = function (password, callback) {
        bcrypt.hash(password, 10, function (error, hash) {
            if (error)
                throw error;
            callback(hash);
        });
    };
    Creator.prototype.getPlayerData = function (player, callback) {
        this.getPasswordHash(player.password, function (hash) {
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
                rank: player.rank,
                ban: player.ban,
                mute: player.mute,
                membership: player.membership,
                lastLogin: player.lastLogin,
                lastWarp: player.lastWarp,
                guildName: player.guildName,
                invisibleIds: player.formatInvisibles(),
                userAgent: player.userAgent,
                mapVersion: player.mapVersion
            });
        });
    };
    Creator.prototype.getPlayerEquipment = function (player) {
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
    };
    /**
     * Crossed over from the MySQL database. This should be refined
     * fairly soon as it is just unnecessary code for speed development.
     * The above object arrays should just be concatenated.
     */
    Creator.getFullData = function (player) {
        var position = player.getSpawn();
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
            poisoned: player.poisoned ? player.poisoned : 0,
            experience: player.experience ? player.experience : 0,
            ban: player.ban ? player.ban : 0,
            mute: player.mute ? player.mute : 0,
            rank: player.rank ? player.rank : 0,
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
    };
    return Creator;
}());
exports["default"] = Creator;
