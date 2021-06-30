import MongoDB from './mongodb';
import log from '../../util/log';

class Loader {
    database: MongoDB;

    constructor(database) {
        this.database = database;
    }

    getInventory(player, callback) {
        this.database.getConnection((database) => {
            let inventory = database.collection('player_inventory'),
                cursor = inventory.find({ username: player.username });

            cursor.toArray().then((inventoryArray) => {
                let info = inventoryArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            '[Loader] Mismatch in usernames whilst retrieving inventory data for: ' +
                                player.username
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
        this.database.getConnection((database) => {
            let bank = database.collection('player_bank'),
                cursor = bank.find({ username: player.username });

            cursor.toArray().then((bankArray) => {
                let info = bankArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            '[Loader] Mismatch in usernames whilst retrieving bank data for: ' +
                                player.username
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
        this.database.getConnection((database) => {
            let quests = database.collection('player_quests'),
                cursor = quests.find({ username: player.username });

            cursor.toArray().then((questArray) => {
                let info = questArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            '[Loader] Mismatch in usernames whilst retrieving quest data for: ' +
                                player.username
                        );

                    callback(info.ids.split(' '), info.stages.split(' '));
                } else callback(null, null);
            });
        });
    }

    getAchievements(player, callback) {
        this.database.getConnection((database) => {
            let achievements = database.collection('player_achievements'),
                cursor = achievements.find({ username: player.username });

            cursor.toArray().then((achievementsArray) => {
                let info = achievementsArray[0];

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            '[Loader] Mismatch in usernames whilst retrieving achievement data for: ' +
                                player.username
                        );

                    callback(info.ids.split(' '), info.progress.split(' '));
                }
            });
        });
    }

    getProfessions(player, callback) {
        this.database.getConnection((database) => {
            let professions = database.collection('player_professions'),
                cursor = professions.find({ username: player.username });

            cursor.toArray().then((professionsArray) => {
                let info = professionsArray[0];

                if (info && info.data) {
                    if (info.username !== player.username)
                        log.notice(
                            '[Loader] Mismatch in usernames whilst retrieving profession data for: ' +
                                player.username
                        );

                    callback(info.data);
                }
            });
        });
    }

    getFriends(player, callback) {
        this.database.getConnection((database) => {
            let friends = database.collection('player_friends'),
                cursor = friends.find({ username: player.username });

            cursor.toArray().then((friendsArray) => {
                let info = friendsArray[0];

                if (info && info.friends) {
                    if (info.username !== player.username)
                        log.notice(
                            '[Loader] Mismatch in usernames whilst retrieving friends data for: ' +
                                player.username
                        );

                    callback(info.friends);
                }
            });
        });
    }
}

export default Loader;
