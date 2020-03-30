"use strict";
exports.__esModule = true;
var _ = require("underscore");
var messages_1 = require("./messages");
var player_1 = require("../game/entity/character/player/player");
var utils_1 = require("../util/utils");
var config_1 = require("../../config");
/**
 *
 */
var Network = /** @class */ (function () {
    function Network(world) {
        this.world = world;
        this.database = world.database;
        this.socket = world.socket;
        this.region = world.region;
        this.map = world.map;
        this.packets = {};
        this.differenceThreshold = 4000;
        this.load();
    }
    Network.prototype.load = function () {
        var _this = this;
        this.world.onPlayerConnection(function (connection) {
            _this.handlePlayerConnection(connection);
        });
        this.world.onPopulationChange(function () {
            _this.handlePopulationChange();
        });
    };
    Network.prototype.parsePackets = function () {
        /**
         * This parses through the packet pool and sends them
         */
        for (var id in this.packets) {
            if (this.packets[id].length > 0 &&
                this.packets.hasOwnProperty(id)) {
                var conn = this.socket.getConnection(id);
                if (conn) {
                    conn.send(this.packets[id]);
                    this.packets[id] = [];
                    this.packets[id].id = id;
                }
                else
                    this.socket.getConnection(id);
            }
        }
    };
    Network.prototype.handlePlayerConnection = function (connection) {
        var clientId = utils_1["default"].generateClientId();
        var player = new player_1["default"](this.world, this.database, connection, clientId);
        var timeDifference = new Date().getTime() - this.getSocketTime(connection);
        if (!config_1["default"].debug && timeDifference - this.differenceThreshold < 5000) {
            connection.sendUTF8('toofast');
            connection.close('Logging in too fast.');
            return;
        }
        this.socket.ips[connection.socket.conn.remoteAddress] = new Date().getTime();
        this.addToPackets(player);
        this.pushToPlayer(player, new messages_1["default"].Handshake({
            id: clientId,
            development: config_1["default"].devClient
        }));
    };
    Network.prototype.handlePopulationChange = function () {
        this.pushBroadcast(new messages_1["default"].Population(this.world.getPopulation()));
    };
    Network.prototype.addToPackets = function (player) {
        this.packets[player.instance] = [];
    };
    /** ***************************************
     * Broadcasting and Socket Communication *
     **************************************** */
    /**
     * Broadcast a message to everyone in the world.
     */
    Network.prototype.pushBroadcast = function (message) {
        _.each(this.packets, function (packet) {
            packet.push(message.serialize());
        });
    };
    /**
     * Broadcast a message to everyone with exceptions.
     */
    Network.prototype.pushSelectively = function (message, ignores) {
        _.each(this.packets, function (packet) {
            if (ignores.indexOf(packet.id) < 0)
                packet.push(message.serialize());
        });
    };
    /**
     * Push a message to a single player.
     */
    Network.prototype.pushToPlayer = function (player, message) {
        if (player && player.instance in this.packets)
            this.packets[player.instance].push(message.serialize());
    };
    /**
     * Specify an array of player instances to send message to
     */
    Network.prototype.pushToPlayers = function (players, message) {
        var _this = this;
        _.each(players, function (playerInstance) {
            _this.pushToPlayer(_this.world.getPlayerByInstance(playerInstance), message);
        });
    };
    /**
     * Send a message to the region the player is currently in.
     */
    Network.prototype.pushToRegion = function (regionId, message, ignoreId) {
        var _this = this;
        var region = this.region.regions[regionId];
        if (!region)
            return;
        _.each(region.players, function (playerInstance) {
            if (playerInstance !== ignoreId)
                _this.pushToPlayer(_this.world.getEntityByInstance(playerInstance), message);
        });
    };
    /**
     * Sends a message to all the surrounding regions of the player.
     * G  G  G
     * G  P  G
     * G  G  G
     */
    Network.prototype.pushToAdjacentRegions = function (regionId, message, ignoreId) {
        var _this = this;
        this.map.regions.forEachAdjacentRegion(regionId, function (id) {
            _this.pushToRegion(id, message, ignoreId);
        });
    };
    /**
     * Sends a message to an array of player names
     */
    Network.prototype.pushToNameArray = function (names, message) {
        var _this = this;
        _.each(names, function (name) {
            var player = _this.world.getPlayerByName(name);
            if (player)
                _this.pushToPlayer(player, message);
        });
    };
    /**
     * Sends a message to the region the player just left from
     */
    Network.prototype.pushToOldRegions = function (player, message) {
        var _this = this;
        _.each(player.recentRegions, function (id) {
            _this.pushToRegion(id, message);
        });
        player.recentRegions = [];
    };
    Network.prototype.getSocketTime = function (connection) {
        return this.socket.ips[connection.socket.conn.remoteAddress];
    };
    return Network;
}());
exports["default"] = Network;
