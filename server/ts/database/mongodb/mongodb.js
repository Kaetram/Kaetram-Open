"use strict";
exports.__esModule = true;
var bcrypt = require("bcrypt");
var mongodb_1 = require("mongodb");
var _ = require("underscore");
var config_1 = require("../../../config");
var creator_1 = require("./creator");
var loader_1 = require("./loader");
/**
 * Creates and initializes a MongoDB client.
 */
var MongoDB = /** @class */ (function () {
    /**
     * Creates an instance of MongoDB.
     * @param host - The network host name for the database to connect to.
     * @param port - The network port number for the database to connect to.
     * @param user - The username data for the MongoDB database.
     * @param password - The password for the MongoDB database.
     * @param database - The name of the database to connect to.
     */
    function MongoDB(host, port, user, password, database) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.database = database;
        this.loader = new loader_1["default"](this);
        this.creator = new creator_1["default"](this);
        this.connection = null;
    }
    MongoDB.prototype.getDatabase = function (callback, type) {
        var _this = this;
        var URL = "mongodb://" + this.host + ":" + this.port + "/" + this.database;
        if (config_1["default"].mongoAuth)
            URL = "mongodb://" + this.user + ":" + this.password + "@" + this.host + ":" + this.port + "/" + this.database;
        var client = new mongodb_1.MongoClient(URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            wtimeout: 5
        });
        if (this.connection) {
            callback(this.connection);
            return;
        }
        client.connect(function (error, newClient) {
            if (error)
                throw error;
            _this.connection = newClient.db(_this.database);
            callback(_this.connection);
        });
    };
    MongoDB.prototype.login = function (player) {
        var _this = this;
        this.getDatabase(function (database) {
            var dataCursor = database
                .collection('player_data')
                .find({ username: player.username });
            var equipmentCursor = database
                .collection('player_equipment')
                .find({ username: player.username });
            var regionsCursor = database
                .collection('player_regions')
                .find({ username: player.username });
            dataCursor.toArray().then(function (playerData) {
                equipmentCursor.toArray().then(function (equipmentData) {
                    regionsCursor.toArray().then(function (regionData) {
                        if (playerData.length === 0)
                            _this.register(player);
                        else {
                            var playerInfo = playerData[0];
                            var equipmentInfo = equipmentData[0];
                            var regions = regionData[0];
                            playerInfo.armour = equipmentInfo.armour;
                            playerInfo.weapon = equipmentInfo.weapon;
                            playerInfo.pendant = equipmentInfo.pendant;
                            playerInfo.ring = equipmentInfo.ring;
                            playerInfo.boots = equipmentInfo.boots;
                            player.load(playerInfo);
                            player.loadRegions(regions);
                            player.intro();
                        }
                    });
                });
            });
        });
    };
    MongoDB.prototype.verify = function (player, callback) {
        this.getDatabase(function (database) {
            var dataCursor = database
                .collection('player_data')
                .find({ username: player.username });
            dataCursor.toArray().then(function (data) {
                if (data.length === 0)
                    callback({ status: 'error' });
                else {
                    var info = data[0];
                    bcrypt.compare(player.password, info.password, function (error, result) {
                        if (error)
                            throw error;
                        if (result)
                            callback({ status: 'success' });
                        else
                            callback({ status: 'error' });
                    });
                }
            });
        });
    };
    MongoDB.prototype.register = function (player) {
        this.getDatabase(function (database) {
            var playerData = database.collection('player_data');
            var cursor = playerData.find({ username: player.username });
            cursor.toArray().then(function (info) {
                if (info.length === 0) {
                    console.info("No player data found for " + player.username + ". Creating user.");
                    player["new"] = true;
                    player.load(creator_1["default"].getFullData(player));
                    player.intro();
                }
            });
        });
    };
    MongoDB.prototype.exists = function (player, callback) {
        this.getDatabase(function (database) {
            var playerData = database.collection('player_data');
            var emailCursor = playerData.find({ email: player.email });
            var usernameCursor = playerData.find({
                username: player.username
            });
            console.info("Looking for - " + player.email + " or " + player.username);
            emailCursor.toArray().then(function (emailArray) {
                if (emailArray.length === 0) {
                    usernameCursor.toArray().then(function (usernameArray) {
                        if (usernameArray.length === 0)
                            callback({ exists: false });
                        else
                            callback({ exists: true, type: 'user' });
                    });
                }
                else
                    callback({ exists: true, type: 'email' });
            });
        });
    };
    MongoDB.prototype["delete"] = function (player) {
        this.getDatabase(function (database) {
            var collections = [
                'player_data',
                'player_equipment',
                'player_inventory',
                'player_abilities',
                'player_bank',
                'player_quests',
                'player_achievements'
            ];
            _.each(collections, function (col) {
                var collection = database.collection(col);
                collection.deleteOne({
                    username: player.username
                }, function (error, result) {
                    if (error)
                        throw error;
                    if (result)
                        console.info("Player " + player.username + " has been deleted.");
                });
            });
        });
    };
    MongoDB.prototype.registeredCount = function (callback) {
        this.getDatabase(function (database) {
            var collection = database.collection('player_data');
            collection.countDocuments().then(function (count) {
                callback(count);
            });
        });
    };
    MongoDB.prototype.resetPositions = function (newX, newY, callback) {
        this.getDatabase(function (database) {
            var collection = database.collection('player_data');
            var cursor = collection.find();
            cursor.toArray().then(function (playerList) {
                _.each(playerList, function (playerInfo) {
                    // eslint-disable-next-line no-underscore-dangle
                    delete playerInfo._id;
                    playerInfo.x = newX;
                    playerInfo.y = newY;
                    collection.updateOne({
                        username: playerInfo.username
                    }, { $set: playerInfo }, {
                        upsert: true
                    }, function (error, result) {
                        if (error)
                            throw error;
                        if (result)
                            callback('Successfully updated positions.');
                    });
                });
            });
        });
    };
    /* Primarily for debugging or should something go wrong. */
    MongoDB.prototype.deleteGuilds = function () {
        this.loader.getGuilds(function (guilds, collection) {
            _.each(guilds, function (guild) {
                collection.deleteOne({ name: guild.name });
            });
        }, true);
    };
    return MongoDB;
}());
exports["default"] = MongoDB;
