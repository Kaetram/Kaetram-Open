import _ from 'lodash';
import World from '../game/world';
import MongoDB from '../database/mongodb/mongodb';
import Messages from './messages';
import Region from '../region/region';
import Map from '../map/map';
import Player from '../game/entity/character/player/player';
import Utils from '../util/utils';
import Connection from './connection';
import config from '../../config';
import SocketHandler from './sockethandler';
import Entities from '../controllers/entities';

class Network {
    world: World;
    entities: Entities;
    database: MongoDB;
    socketHandler: SocketHandler;
    region: Region;
    map: Map;

    packets: any;
    differenceThreshold: number;

    constructor(world: World) {
        this.world = world;
        this.entities = world.entities;
        this.database = world.database;
        this.socketHandler = world.socketHandler;
        this.region = world.region;
        this.map = world.map;

        this.packets = {};

        this.differenceThreshold = 4000;

        this.load();
    }

    load(): void {
        this.world.onPlayerConnection((connection: Connection) => {
            this.handlePlayerConnection(connection);
        });

        this.world.onPopulationChange(() => {
            this.handlePopulationChange();
        });
    }

    parsePackets(): void {
        /**
         * This parses through the packet pool and sends them
         */

        for (let id in this.packets)
            if (this.packets[id].length > 0) {
                let conn = this.socketHandler.get(id);

                if (conn) {
                    conn.send(this.packets[id]);
                    this.packets[id] = [];
                    this.packets[id].id = id;
                } else this.socketHandler.remove(id);
            }
    }

    handlePlayerConnection(connection: Connection): void {
        let clientId = Utils.generateClientId(),
            player = new Player(this.world, this.database, connection, clientId),
            timeDifference = Date.now() - this.getSocketTime(connection);

        if (!config.debug && timeDifference < this.differenceThreshold) {
            connection.sendUTF8('toofast');
            connection.close('Logging in too fast.');

            return;
        }

        this.socketHandler.ips[connection.socket.conn.remoteAddress] = Date.now();

        this.addToPackets(player);

        this.pushToPlayer(
            player,
            new Messages.Handshake({
                id: clientId,
                development: config.devClient
            })
        );
    }

    handlePopulationChange(): void {
        this.pushBroadcast(new Messages.Population(this.world.getPopulation()));
    }

    addToPackets(player: Player): void {
        this.packets[player.instance] = [];
    }

    /*****************************************
     * Broadcasting and Socket Communication *
     *****************************************/

    /**
     * Broadcast a message to everyone in the world.
     */

    pushBroadcast(message: typeof Messages): void {
        _.each(this.packets, (packet: any) => {
            packet.push(message.serialize());
        });
    }

    /**
     * Broadcast a message to everyone with exceptions.
     */

    pushSelectively(message: typeof Messages, ignores?: string[]): void {
        _.each(this.packets, (packet: any) => {
            if (ignores.includes(packet.id)) return;

            packet.push(message.serialize());
        });
    }

    /**
     * Push a message to a single player.
     */

    pushToPlayer(player: Player, message: typeof Messages): void {
        if (player && player.instance in this.packets)
            this.packets[player.instance].push(message.serialize());
    }

    /**
     * Specify an array of player instances to send message to
     */

    pushToPlayers(players: Player, message: typeof Messages): void {
        _.each(players, (instance: string) => {
            this.pushToPlayer(this.entities.get(instance) as Player, message);
        });
    }

    /**
     * Send a message to the region the player is currently in.
     */

    pushToRegion(regionId: string, message: typeof Messages, ignoreId?: string): void {
        let region = this.region.regions[regionId];

        if (!region) return;

        _.each(region.players, (instance: string) => {
            if (instance !== ignoreId)
                this.pushToPlayer(this.entities.get(instance) as Player, message);
        });
    }

    /**
     * Sends a message to all the surrounding regions of the player.
     * G  G  G
     * G  P  G
     * G  G  G
     */

    pushToAdjacentRegions(regionId: string, message: typeof Messages, ignoreId?: string): void {
        this.map.regions.forEachSurroundingRegion(regionId, (id: string) => {
            this.pushToRegion(id, message, ignoreId);
        });
    }

    /**
     * Sends a message to an array of player names
     */

    pushToNameArray(names: string[], message: typeof Messages): void {
        _.each(names, (name: string) => {
            let player = this.world.getPlayerByName(name);

            if (player) this.pushToPlayer(player, message);
        });
    }

    /**
     * Sends a message to the region the player just left from
     */

    pushToOldRegions(player: Player, message: typeof Messages): void {
        _.each(player.recentRegions, (id: string) => {
            this.pushToRegion(id, message);
        });

        player.recentRegions = [];
    }

    getSocketTime(connection: Connection): number {
        return this.socketHandler.ips[connection.socket.conn.remoteAddress];
    }
}

export default Network;
