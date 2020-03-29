let World = require('../game/world'),
    Messages = require('./messages'),
    Packets = require('./packets'),
    Player = require('../game/entity/character/player/player'),
    Utils = require('../util/utils'),
    _ = require('underscore');

class Network {

    constructor(world) {
        let self = this;

        self.world = world;
        self.database = world.database;
        self.socket = world.socket;
        self.region = world.region;
        self.map = world.map;

        self.packets = {};

        self.differenceThreshold = 4000;

        self.load();
    }

    load() {
        let self = this;

        self.world.onPlayerConnection((connection) => {
            self.handlePlayerConnection(connection);
        });

        self.world.onPopulationChange(() => {
            self.handlePopulationChange();
        });
    }

    parsePackets() {
        let self = this;

        /**
         * This parses through the packet pool and sends them
         */

        for (let id in self.packets) {
            if (self.packets[id].length > 0 && self.packets.hasOwnProperty(id)) {
                let conn = self.socket.getConnection(id);

                if (conn) {
                    conn.send(self.packets[id]);
                    self.packets[id] = [];
                    self.packets[id].id = id;
                } else
                    delete self.socket.getConnection(id);
            }
        }
    }

    handlePlayerConnection(connection) {
        let self = this,
            clientId = Utils.generateClientId(),
            player = new Player(self.world, self.database, connection, clientId),
            timeDifference = new Date().getTime() - self.getSocketTime(connection);

        if (!config.debug && timeDifference - self.differenceThreshold < 5000) {
            connection.sendUTF8('toofast');
            connection.close('Logging in too fast.');

            return;
        }

        self.socket.ips[connection.socket.conn.remoteAddress] = new Date().getTime();

        self.addToPackets(player);

        self.pushToPlayer(player, new Messages.Handshake({
            id: clientId,
            development: config.devClient
        }));
    }

    handlePopulationChange() {
        this.pushBroadcast(new Messages.Population(this.world.getPopulation()));
    }

    addToPackets(player) {
        this.packets[player.instance] = [];
    }

    /*****************************************
     * Broadcasting and Socket Communication *
     *****************************************/

    /**
     * Broadcast a message to everyone in the world.
     */

    pushBroadcast(message) {
        let self = this;

        _.each(self.packets, (packet) => {
            packet.push(message.serialize());
        });
    }

    /**
     * Broadcast a message to everyone with exceptions.
     */

    pushSelectively(message, ignores) {
        let self = this;

        _.each(self.packets, (packet) => {
            if (ignores.indexOf(packet.id) < 0)
                packet.push(message.serialize());
        });
    }

    /**
     * Push a message to a single player.
     */

    pushToPlayer(player, message) {
        if (player && player.instance in this.packets)
            this.packets[player.instance].push(message.serialize());
    }

    /**
     * Specify an array of player instances to send message to
     */

    pushToPlayers(players, message) {
        let self = this;

        _.each(players, (playerInstance) => {
            self.pushToPlayer(self.world.getPlayerByInstance(playerInstance), message);
        });
    }

    /**
     * Send a message to the region the player is currently in.
     */

    pushToRegion(regionId, message, ignoreId) {
        let self = this,
            region = self.region.regions[regionId];

        if (!region) return;

        _.each(region.players, (playerInstance) => {
            if (playerInstance !== ignoreId)
                self.pushToPlayer(self.world.getEntityByInstance(playerInstance), message);
        });
    }

    /**
     * Sends a message to all the surrounding regions of the player.
     * G  G  G
     * G  P  G
     * G  G  G
     */

    pushToAdjacentRegions(regionId, message, ignoreId) {
        let self = this;

        self.map.regions.forEachSurroundingRegion(regionId, (id) => {
            self.pushToRegion(id, message, ignoreId);
        });
    }

    /**
     * Sends a message to an array of player names
     */

    pushToNameArray(names, message) {
        let self = this;

        _.each(names, (name) => {
            let player = self.world.getPlayerByName(name);

            if (player)
                self.pushToPlayer(player, message);
        });
    }

    /**
     * Sends a message to the region the player just left from
     */

    pushToOldRegions(player, message) {
        let self = this;

        _.each(player.recentRegions, (id) => {
            self.pushToRegion(id, message);
        });

        player.recentRegions = [];
    }

    getSocketTime(connection) {
        return this.socket.ips[connection.socket.conn.remoteAddress];
    }

}

module.exports = Network;
