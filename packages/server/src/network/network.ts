import { Handshake } from './packets';

import Player from '../game/entity/character/player/player';

import config from '@kaetram/common/config';
import _ from 'lodash-es';

import type Entities from '../controllers/entities';
import type MongoDB from '../database/mongodb/mongodb';
import type Regions from '../game/map/regions';
import type World from '../game/world';
import type Connection from './connection';
import type Packet from './packet';
import type SocketHandler from './sockethandler';

export default class Network {
    private entities: Entities;
    private database: MongoDB;
    private socketHandler: SocketHandler;

    private regions: Regions;

    private timeoutThreshold = 4000;
    private packets: { [id: string]: unknown[] } = {};

    public constructor(private world: World) {
        this.entities = world.entities;
        this.database = world.database;
        this.socketHandler = world.socketHandler;

        this.regions = world.map.regions;
    }

    /**
     * This function parses all the packets currently in the queue.
     * We take each player instance and for each one we parse its
     * outstanding packets. Those are sent to each player's connection.
     * When we're done, we remove the packet from the queue (duhhh).
     */

    public parse(): void {
        for (let id in this.packets)
            if (this.packets[id].length > 0) {
                let connection = this.socketHandler.get(id);

                if (connection) {
                    connection.send(this.packets[id]);

                    this.packets[id] = [];
                } else this.socketHandler.remove(id);
            }
    }

    /**
     * We create a player instance when we receive a connection and begin a
     * handshake with the client. After the handshake we request login information
     * and check the validity with our database.
     * @param connection The connection that we receive and parse the details of.
     */

    public handleConnection(connection: Connection): void {
        let player = new Player(this.world, this.database, connection),
            timeDifference = Date.now() - this.getLastConnection(connection);

        if (!config.debugging && timeDifference < this.timeoutThreshold)
            return connection.reject('toofast');

        this.createPacketQueue(player);

        this.send(player, new Handshake());
    }

    /**
     * We create a queue which contains packets to parse. Whenever we
     * add packets to this queue, the `parse` function called asynchronously
     * from the `World` will iterate through the queue.
     * @param player The player instance that wec created in `handleConnection`
     */

    private createPacketQueue(player: Player): void {
        this.packets[player.instance] = [];
    }

    /**
     * Takes the player's packet queue and erases it from all the queues.
     * @param player The player we are deleting packet queue of.
     */

    public deletePacketQueue(player: Player): void {
        delete this.packets[player.instance];
    }

    /*****************************************
     * Broadcasting and Socket Communication *
     *****************************************/

    /**
     * Broadcasts a packet to the entire server.
     * @param packet The packet to be broadcasted.
     */

    public broadcast(packet: Packet): void {
        _.each(this.packets, (queue: unknown[]) => {
            queue.push(packet.serialize());
        });
    }

    /**
     * Send a packet to a player's connection.
     * @param player A player instance
     * @param packet Packet that we are sending.
     */

    public send(player: Player, packet: Packet): void {
        if (!player || !(player.instance in this.packets)) return;

        this.packets[player.instance].push(packet.serialize());
    }

    /**
     * Iterates through a list of players and sends a packet to each.
     * @param players A list containing player objects.
     * @param packet The packet we are sending to the list of players.
     */

    public sendToPlayers(players: Player[], packet: Packet): void {
        _.each(players, (player: Player) => this.send(player, packet));
    }

    /**
     * Finds a region based on the `regionId` and sends a packet to each
     * player in that region.
     * @param regionId The region id we are grabbing the players from.
     * @param packet The packet we are sending to each player.
     * @param ignore Optional parameter to ignore an entity instance when sending a packet.
     */

    public sendToRegion(regionId: number, packet: Packet, ignore?: string): void {
        let region = this.regions.get(regionId);

        if (!region) return;

        region.forEachPlayer((player: Player) => {
            if (player.instance !== ignore) this.send(player, packet);
        });
    }

    /**
     * An extension of the `sendToRegion.` For each surrounding area around
     * `regionId` we send a packet to each player in each region.
     * @param regionId The region to look for surrounding regions around.
     * @param packet The packet we are sending to each player in each region.
     * @param ignore Optional parameter to ignore an entity instance when sending a packet.
     */

    public sendToSurroundingRegions(regionId: number, packet: Packet, ignore?: string): void {
        if (regionId < 0) return;

        this.regions.forEachSurroundingRegion(regionId, (surroundingRegion: number) => {
            this.sendToRegion(surroundingRegion, packet, ignore);
        });
    }

    /**
     * Sends a packet to a list of regions specified. Generally used to send to old regions.
     * @param list The list of regions we are sending the packet to.
     * @param packet The packet we are sending to each player in each region.
     * @param ignore Optional parameter to ignore an entity instance when sending a packet.
     */

    public sendToRegionList(list: number[], packet: Packet, ignore?: string): void {
        _.each(list, (region: number) => {
            this.sendToRegion(region, packet, ignore);
        });
    }

    /**
     * Gets the UNIX epoch time for the connection. We create this
     * whenever a connection is made.
     */

    private getLastConnection(connection: Connection): number {
        return this.socketHandler.addressTimes[connection.address];
    }
}
