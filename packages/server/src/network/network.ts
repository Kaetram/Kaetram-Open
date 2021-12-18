import _ from 'lodash';

import config from '@kaetram/common/config';
import Utils from '@kaetram/common/util/utils';

import Player from '../game/entity/character/player/player';
import Messages, { Packet } from './messages';

import type World from '../game/world';
import type Connection from './connection';
import Entities from '../controllers/entities';
import SocketHandler from './sockethandler';
import Map from '../game/map/map';
import Regions from '../game/map/regions';
import MongoDB from '../database/mongodb/mongodb';

type PacketsList = unknown[] & { id?: string };

export default class Network {
    private entities: Entities;
    private database: MongoDB;
    private socketHandler: SocketHandler;

    private regions: Regions;

    public packets: { [id: string]: PacketsList } = {};
    private differenceThreshold = 4000;

    public constructor(private world: World) {
        this.entities = world.entities;
        this.database = world.database;
        this.socketHandler = world.socketHandler;

        this.regions = world.map.regions;

        this.load();
    }

    private load(): void {
        this.world.onConnection((connection: Connection) => {
            this.handlePlayerConnection(connection);
        });

        this.world.onPopulationChange(() => {
            this.handlePopulationChange();
        });
    }

    /**
     * This parses through the packet pool and sends them
     */
    public parse(): void {
        for (let id in this.packets)
            if (this.packets[id].length > 0) {
                let conn = this.socketHandler.get(id);

                if (conn) {
                    conn.send(this.packets[id]);
                    this.packets[id] = [] as PacketsList;
                    this.packets[id].id = id;
                } else this.socketHandler.remove(id);
            }
    }

    private handlePlayerConnection(connection: Connection): void {
        let clientId = Utils.generateClientId(),
            player = new Player(this.world, this.database, connection, clientId),
            timeDifference = Date.now() - this.getSocketTime(connection);

        if (!config.debugging && timeDifference < this.differenceThreshold) {
            connection.sendUTF8('toofast');
            connection.close('Logging in too fast.');

            return;
        }

        this.addToPackets(player);

        this.pushToPlayer(
            player,
            new Messages.Handshake({
                id: clientId
            })
        );
    }

    private handlePopulationChange(): void {
        this.pushBroadcast(new Messages.Population(this.world.getPopulation()));
    }

    private addToPackets(player: Player): void {
        this.packets[player.instance] = [] as PacketsList;
    }

    /*****************************************
     * Broadcasting and Socket Communication *
     *****************************************/

    /**
     * Broadcast a message to everyone in the world.
     */
    public pushBroadcast(message: Packet): void {
        _.each(this.packets, (packet) => {
            packet.push(message.serialize());
        });
    }

    /**
     * Broadcast a message to everyone with exceptions.
     */
    public pushSelectively(message: Packet, ignores: string[]): void {
        _.each(this.packets, (packet) => {
            if (ignores.includes(packet.id!)) return;

            packet.push(message.serialize());
        });
    }

    /**
     * Push a message to a single player.
     */
    public pushToPlayer(player: Player, message: Packet): void {
        if (player && player.instance in this.packets)
            this.packets[player.instance].push(message.serialize());
    }

    /**
     * Specify an array of player instances to send message to
     */
    public pushToPlayers(players: string[], message: Packet): void {
        _.each(players, (instance) => {
            this.pushToPlayer(this.entities.get(instance) as Player, message);
        });
    }

    /**
     * Send a message to the region the player is currently in.
     */
    public pushToRegion(regionId: number, message: Packet, ignoreId?: string): void {
        let region = this.regions.get(regionId);

        if (!region) return;

        region.forEachPlayer((player: Player) => {
            if (player.instance !== ignoreId) this.pushToPlayer(player, message);
        });
    }

    /**
     * Sends a message to all the surrounding regions of the player.
     * G  G  G
     * G  P  G
     * G  G  G
     */
    public pushToAdjacentRegions(regionId: number, message: Packet, ignoreId?: string): void {
        this.regions.forEachSurroundingRegion(regionId, (surroundingRegion: number) => {
            this.pushToRegion(surroundingRegion, message, ignoreId);
        });
    }

    /**
     * Sends a message to an array of player names
     */
    public pushToNameArray(names: string[], message: Packet): void {
        _.each(names, (name: string) => {
            let player = this.world.getPlayerByName(name);

            if (player) this.pushToPlayer(player, message);
        });
    }

    /**
     * Sends a message to the region the player just left from
     */
    public pushToOldRegions(player: Player, message: Packet): void {
        //TODO
        // _.each(player.recentRegions, (id: string) => {
        //     this.pushToRegion(id, message);
        // });
        // player.recentRegions = [];
    }

    private getSocketTime(connection: Connection): number {
        return this.socketHandler.ips[connection.socket.conn.remoteAddress];
    }
}
