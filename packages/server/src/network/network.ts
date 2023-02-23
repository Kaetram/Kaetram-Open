import { Handshake } from './packets';

import Player from '../game/entity/character/player/player';

import config from '@kaetram/common/config';

import type Packet from './packet';
import type World from '../game/world';
import type Connection from './connection';
import type Regions from '../game/map/regions';
import type SocketHandler from './sockethandler';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';

export default class Network {
    private database: MongoDB;
    private socketHandler: SocketHandler;

    private regions: Regions;

    private timeoutThreshold = 5000;
    private packets: { [instance: string]: unknown[] } = {};

    public constructor(private world: World) {
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
        for (let instance in this.packets)
            if (this.packets[instance].length > 0) {
                let connection = this.socketHandler.get(instance);

                if (connection) {
                    connection.send(this.packets[instance]);

                    this.packets[instance] = [];
                } else this.socketHandler.remove(instance);
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

        if (!config.debugging) {
            // Check that the connections aren't coming too fast.
            if (timeDifference < this.timeoutThreshold) return connection.reject('toofast');

            // Ensure that we don't have too many connections from the same IP address.
            if (this.socketHandler.isMaxConnections(connection.address))
                return connection.reject('toomany');
        }

        this.socketHandler.updateLastTime(connection.address);

        this.createPacketQueue(player);

        this.send(
            player,
            new Handshake({
                instance: player.instance,
                serverId: config.serverId
            })
        );
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
        for (let queue of Object.values(this.packets)) queue.push(packet.serialize());
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
        for (let player of players) this.send(player, packet);
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
        for (let region of list) this.sendToRegion(region, packet, ignore);
    }

    /**
     * Gets the UNIX epoch time for the connection. We create this
     * whenever a connection is made.
     */

    private getLastConnection(connection: Connection): number {
        return this.socketHandler.addresses[connection.address].lastTime;
    }
}
