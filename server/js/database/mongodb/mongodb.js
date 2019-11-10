/* global module */

let MongoClient = require('mongodb').MongoClient,
    Loader = require('./loader'),
    Creator = require('./creator'),
    bcrypt = require('bcrypt'),
    _ = require('underscore'),
    config = require('../../../config');

class MongoDB {

    constructor(host, port, user, password, database) {
        let self = this;

        self.host = host;
        self.port = port;
        self.user = user;
        self.password = password;
        self.database = database;

        self.loader = new Loader(self);
        self.creator = new Creator(self);

        self.connection = null;
    }

    getDatabase(callback, type) {
        let self = this,
            URL = `mongodb://${self.user}:${self.password}@${self.host}:${self.port}/${self.database}`,
            client = new MongoClient(URL, {
              useUnifiedTopology: true,
              useNewUrlParser: true,
              wtimeout: 5
            });

        if (self.connection) {
            callback(self.connection);
            return;
        }

        client.connect((error, newClient) => {
            if (error) throw error;

            self.connection = newClient.db(self.database);

            callback(self.connection);
        });

    }

    login(player) {
        let self = this;

        self.getDatabase((database) => {
            let dataCursor = database.collection('player_data').find({ username: player.username }),
                equipmentCursor = database.collection('player_equipment').find({ username: player.username }),
                regionsCursor = database.collection('player_regions').find({ username: player.username });

            dataCursor.toArray().then((playerData) => {
                equipmentCursor.toArray().then((equipmentData) => {
                    regionsCursor.toArray().then((regionData) => {

                        if (playerData.length === 0)
                            self.register(player);
                        else {
                            let playerInfo = playerData[0],
                                equipmentInfo = equipmentData[0],
                                regions = regionData[0];

                            playerInfo['armour'] = equipmentInfo.armour;
                            playerInfo['weapon'] = equipmentInfo.weapon;
                            playerInfo['pendant'] = equipmentInfo.pendant;
                            playerInfo['ring'] = equipmentInfo.ring;
                            playerInfo['boots'] = equipmentInfo.boots;

                            if (regions && regions.gameVersion === config.gver)
                                player.regionsLoaded = regions.regions.split(',');

                            player.load(playerInfo);
                            player.intro();
                        }

                    });
                });
            })
        });
    }

    verify(player, callback) {
        let self = this;

        self.getDatabase((database) => {
            let dataCursor = database.collection('player_data').find({ username: player.username });

            dataCursor.toArray().then((data) => {
                if (data.length === 0)
                    callback({ status: 'error' });
                else {
                    let info = data[0];

                    bcrypt.compare(player.password, info.password, (error, result) => {
                        if (error) throw error;

                        if (result)
                            callback({ status: 'success' });
                        else
                            callback({ status: 'error' });
                    });
                }
            })
        });
    }

    register(player) {
        let self = this;

        self.getDatabase((database) => {
            let playerData = database.collection('player_data'),
                cursor = playerData.find({ username: player.username });

            cursor.toArray().then((info) => {
                if (info.length === 0) {
                    log.info('No player data found for ' + player.username + '. Creating user.');

                    player.load(Creator.getFullData(player));
                    player.intro();
                }
            });
        });
    }

    exists(player, callback) {
        let self = this;

        self.getDatabase((database) => {
            let playerData = database.collection('player_data'),
                emailCursor = playerData.find({ email: player.email }),
                usernameCursor = playerData.find({ username: player.username });

            log.info('Looking for - ' + player.email +' or ' + player.username);

            emailCursor.toArray().then((emailArray) => {
                if (emailArray.length === 0) {
                    usernameCursor.toArray().then((usernameArray) => {
                        if (usernameArray.length === 0)
                            callback({ exists: false });
                        else
                            callback({ exists: true, type: 'user' });
                    });
                } else
                    callback({ exists: true, type: 'email' });
            });
        });
    }

    delete(player) {
        let self = this;

        self.getDatabase((database) => {
            let collections = ['player_data', 'player_equipment', 'player_inventory', 'player_abilities', 'player_bank', 'player_quests', 'player_achievements'];

            _.each(collections, (col) => {
                let collection = database.collection(col);

                collection.deleteOne({
                    username: player.username
                }, (error, result) => {
                    if (error) throw error;

                    if (result)
                        log.info('Player ' + player.username + ' has been deleted.')
                })
            });
        });
    }

}

module.exports = MongoDB;
