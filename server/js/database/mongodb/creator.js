/* global module */

const bcrypt = require('bcrypt');
const config = require('../../../config');

class Creator {
    constructor(database) {
        this.database = database;
    }

    save(player) {
        const self = this;

        self.database.getDatabase(database => {
            const playerData = database.collection('player_data');
            const playerEquipment = database.collection('player_equipment');
            const playerQuests = database.collection('player_quests');
            const playerAchievements = database.collection('player_achievements');
            const playerBank = database.collection('player_bank');
            const playerRegions = database.collection('player_regions');
            const playerAbilities = database.collection('player_abilities');
            const playerInventory = database.collection('player_inventory');

            self.savePlayerData(playerData, player);
            self.savePlayerEquipment(playerEquipment, player);
            self.savePlayerQuests(playerQuests, player);
            self.savePlayerAchievements(playerAchievements, player);
            self.savePlayerBank(playerBank, player);
            self.savePlayerRegions(playerRegions, player);
            self.savePlayerAbilities(playerAbilities, player);
            self.savePlayerInventory(playerInventory, player, () => {
                database.close();
            });
        });
    }

    savePlayerData(collection, player) {
        Creator.getPlayerData(player, data => {
            collection.updateOne({
                username: player.username
            }, { $set: data }, {
                upsert: true
            }, (error, result) => {
                if (error)
                    throw error;

                if (result)
                    log.debug('Player ' + player.username + ' data has been saved successfully.');
            });
        });
    }

    savePlayerEquipment(collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: Creator.getPlayerEquipment(player) }, {
            upsert: true
        }, (error, result) => {
            if (error)
                throw error;

            if (result)
                log.debug('Player ' + player.username + ' equipment data has been saved successfully.');
        });
    }

    savePlayerQuests(collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.quests.getQuests() }, {
            upsert: true
        }, (error, result) => {
            if (error)
                throw error;

            if (result)
                log.debug('Player ' + player.username + ' quest data has been saved successfully.');
        });
    }

    savePlayerAchievements(collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.quests.getAchievements() }, {
            upsert: true
        }, (error, result) => {
            if (error)
                throw error;

            if (result)
                log.debug('Player ' + player.username + ' achievement data has been saved successfully.');
        });
    }

    savePlayerBank(collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.bank.getArray() }, {
            upsert: true
        }, (error, result) => {
            if (error)
                throw error;

            if (result)
                log.debug('Player ' + player.username + ' bank data has been saved successfully.');
        });
    }

    savePlayerRegions(collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: { regions: player.regionsLoaded.toString(), gameVersion: config.gver } }, {
            upsert: true
        }, (error, result) => {
            if (error) throw error;

            if (result)
                log.debug('Player ' + player.username + ' regions data has been saved successfully.');
        });
    }

    savePlayerAbilities(collection, player) {
        collection.updateOne({
            username: player.username
        }, { $set: player.abilities.getArray() }, {
            upsert: true
        }, (error, result) => {
            if (error)
                throw error;

            if (result)
                log.debug('Player ' + player.username + ' abilities data has been saved successfully.');
        });
    }

    savePlayerInventory(collection, player, callback) {
        collection.updateOne({
            username: player.username
        }, { $set: player.inventory.getArray() }, {
            upsert: true
        }, (error, result) => {
            if (error)
                throw error;

            if (result)
                log.debug('Player ' + player.username + ' inventory data has been saved successfully.');
        });
    }

    static getPasswordHash(password, callback) {
        bcrypt.hash(password, 10, (error, hash) => {
            if (error) throw error;

            callback(hash);
        });
    }

    static getPlayerData(player, callback) {
        Creator.getPasswordHash(player.password, hash => {
            callback({
                username: player.username,
                password: hash,
                email: player.email,
                x: player.x,
                y: player.y,
                experience: player.experience,
                kind: player.kind,
                rights: player.rights,
                poisoned: player.poisoned,
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
                userAgent: player.userAgent
            });
        });
    }

    static getPlayerEquipment(player) {
        return {
            username: player.username,
            armour: [player.armour ? player.armour.getId() : 114, player.armour ? player.armour.getCount() : 0, player.armour ? player.armour.getAbility() : 0, player.armour ? player.armour.getAbilityLevel() : 0],
            weapon: [player.weapon ? player.weapon.getId() : -1, player.weapon ? player.weapon.getCount() : 0, player.weapon ? player.weapon.getAbility() : 0, player.weapon ? player.weapon.getAbilityLevel() : 0],
            pendant: [player.pendant ? player.pendant.getId() : -1, player.pendant ? player.pendant.getCount() : 0, player.pendant ? player.pendant.getAbility() : 0, player.pendant ? player.pendant.getAbilityLevel() : 0],
            ring: [player.ring ? player.ring.getId() : -1, player.ring ? player.ring.getCount() : 0, player.ring ? player.ring.getAbility() : 0, player.ring ? player.ring.getAbilityLevel() : 0],
            boots: [player.boots ? player.boots.getId() : -1, player.boots ? player.boots.getCount() : 0, player.boots ? player.boots.getAbility() : 0, player.boots ? player.boots.getAbilityLevel() : 0]
        };
    }

    /**
     * Crossed over from the MySQL database. This should be refined
     * fairly soon as it is just unnecessary code for speed development.
     * The above object arrays should just be concatenated.
     */

    static getFullData(player) {
        const position = player.getSpawn();

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
            armour: [player.armour ? player.armour.getId() : 114, player.armour ? player.armour.getCount() : 0, player.armour ? player.armour.getAbility() : 0, player.armour ? player.armour.getAbilityLevel() : 0],
            weapon: [player.weapon ? player.weapon.getId() : -1, player.weapon ? player.weapon.getCount() : 0, player.weapon ? player.weapon.getAbility() : 0, player.weapon ? player.weapon.getAbilityLevel() : 0],
            pendant: [player.pendant ? player.pendant.getId() : -1, player.pendant ? player.pendant.getCount() : 0, player.pendant ? player.pendant.getAbility() : 0, player.pendant ? player.pendant.getAbilityLevel() : 0],
            ring: [player.ring ? player.ring.getId() : -1, player.ring ? player.ring.getCount() : 0, player.ring ? player.ring.getAbility() : 0, player.ring ? player.ring.getAbilityLevel() : 0],
            boots: [player.boots ? player.boots.getId() : -1, player.boots ? player.boots.getCount() : 0, player.boots ? player.boots.getAbility() : 0, player.boots ? player.boots.getAbilityLevel() : 0]
        };
    }
}

module.exports = Creator;
