/* global module */

class Loader {

    constructor(database) {
        this.database = database;
    }

    getInventory(player, callback) {
        let self = this;

        self.database.getDatabase((database) => {
            let inventory = database.collection('player_inventory'),
                cursor = inventory.find({ username: player.username });

            cursor.toArray().then((inventoryArray) => {
                let info = inventoryArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice('[Loader] Mismatch in usernames whilst retrieving inventory data for: ' + player.username);

                    callback(info.ids.split(' '), info.counts.split(' '), info.abilities.split(' '), info.abilityLevels.split(' '));
                } else
                    callback(null, null, null, null);

            });
        });
    }

    getBank(player, callback) {
        let self = this;

        self.database.getDatabase((database) => {
            let bank = database.collection('player_bank'),
                cursor = bank.find({ username: player.username });

            cursor.toArray().then((bankArray) => {
                let info = bankArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice('[Loader] Mismatch in usernames whilst retrieving bank data for: ' + player.username);

                    callback(info.ids.split(' '), info.counts.split(' '), info.abilities.split(' '), info.abilityLevels.split(' '));
                }

            });
        });
    }

    getQuests(player, callback) {
        let self = this;

        self.database.getDatabase((database) => {
            let quests = database.collection('player_quests'),
                cursor = quests.find({ username: player.username });

            cursor.toArray().then((questArray) => {
                let info = questArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice('[Loader] Mismatch in usernames whilst retrieving quest data for: ' + player.username);

                    callback(info.ids.split(' '), info.stages.split(' '));
                } else
                    callback(null, null);
            });
        });
    }

    getAchievements(player, callback) {
        let self = this;

        self.database.getDatabase((database) => {
            let achievements = database.collection('player_achievements'),
                cursor = achievements.find({ username: player.username });

            cursor.toArray().then((achievementsArray) => {
                let info = achievementsArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice('[Loader] Mismatch in usernames whilst retrieving achievement data for: ' + player.username);

                    callback(info.ids.split(' '), info.progress.split(' '));
                }

            });
        });
    }

}

module.exports = Loader;
