import Server from '../model/server';
import Packet from '../network/packet';

import log from '@kaetram/common/util/log';
import { Packets, Opcodes } from '@kaetram/common/network';

import type { Friend } from '@kaetram/common/types/friends';
import type Connection from '../network/connection';
import type { SerializedServer } from '@kaetram/common/types/network';

type ServerCallback = (id: number, name: string) => void;
export default class Servers {
    private servers: { [instance: string]: Server } = {};

    private addCallback?: ServerCallback;
    private removeCallback?: ServerCallback;
    private updateCallback?: () => void;

    /**
     * Handles the creation of a new server object upon initial connection. This creates
     * the object and adds it to our list of servers after the handshake has completed.
     * @param instance The instance of the server we are connecting to.
     * @param connection The websocket connection to the server.
     */

    public connect(instance: string, connection: Connection): void {
        let server = new Server(instance, connection);

        // Callback for when the server finishes the handshake.
        server.onReady(() => this.add(server));
        server.onBroadcast((packet: Packet) => {
            // Servers send broadcasts for population changes, so it's best to do an update here.
            this.updateCallback?.();

            this.broadcast(packet, server.instance);
        });

        server.onMessage((source: string, message: string, target: string) => {
            let targetServer = this.findPlayer(target);

            // Could not find the player, relay a message that the player is not online.
            if (!targetServer)
                return server.send(
                    new Packet(Packets.Player, Opcodes.Player.Chat, { chatError: 'notfound' })
                );

            // Send the private message to the target player's server.
            targetServer.send(
                new Packet(Packets.Player, Opcodes.Player.Chat, { source, message, target })
            );
        });

        server.onFriends((username: string, inactiveFriends: string[]) => {
            let activeFriends: Friend = {};

            // Look through all the inactive friends and try to find them on a server.
            for (let friend of inactiveFriends) {
                let targetServer = this.findPlayer(friend);

                // If the player is online, add them to the active friends list.
                if (targetServer)
                    activeFriends[friend] = { online: true, serverId: targetServer.id };
            }

            // Send the active friends back to the server.
            server.send(
                new Packet(Packets.Player, Opcodes.Player.Friends, { username, activeFriends })
            );
        });
    }

    /**
     * Handles adding a server to our list of servers.
     * @param server The server object we are adding.
     */

    private add(server: Server): void {
        if (server.instance in this.servers)
            return log.error(`Server ${server.instance} already exists.`);

        this.servers[server.instance] = server;

        this.addCallback?.(server.id, server.name);
    }

    /**
     * Handles removing a server from our list of servers.
     * @param instance The instance of the server we are removing.
     */

    public remove(instance: string): void {
        // Prevent crashes from removing non-existent servers.
        if (!(instance in this.servers)) return;

        this.removeCallback?.(this.servers[instance].id, this.servers[instance].name);

        delete this.servers[instance];
    }

    /**
     * Broadcasts a message to all servers. Optionally we can exclude a server.
     * @param packet The packet object that we want to send to the server.
     * @param exclude The server we are excluding from the broadcast.
     */

    public broadcast(packet: Packet, exclude = ''): void {
        for (let server in this.servers) {
            if (server === exclude) continue;

            this.servers[server].send(packet);
        }
    }

    /**
     * Relays a global chat message to all the servers connected to the hub.
     * @param source Who is sending the message (generally someone on Discord).
     * @param message The string contents of the message.
     * @param colour Colour of the text we are sending.
     */

    public global(source: string, message: string, colour: string): void {
        this.broadcast(
            new Packet(Packets.Player, Opcodes.Player.Chat, {
                source,
                message,
                colour
            })
        );
    }

    /**
     * Checks that there is at least one server with space for a new player.
     * @returns Whether or not some of the servers have more player spaces than amount of players.
     */

    public hasSpace(): boolean {
        return Object.values(this.servers).some((server: Server) => {
            return server.players.length < server.maxPlayers;
        });
    }

    /**
     * Looks through all the servers and finds one
     * that has enough space.
     * @param callback Server with enough space for players.
     */

    public findEmpty(callback: (server: Server) => void): void {
        this.forEachServer((server) => {
            // -1 for a threshold of empty space.
            if (server.players.length >= server.maxPlayers - 1) return;

            callback(server);
        });
    }

    /**
     * Searches through all the servers and finds whether or not
     * the server contains the `username` specified.
     * @param username The username we are looking for.
     * @returns The server containing the user.
     */

    public findPlayer(username: string): Server | undefined {
        for (let key in this.servers)
            if (this.servers[key].players.includes(username)) return this.servers[key];

        return undefined;
    }

    /**
     * Looks through all the servers and adds the amount of players currently online.
     * @returns Number of total players spanning all servers.
     */

    public getTotalPlayers(): number {
        let total = 0;

        // Iterate through all the servers and add the amount of players.
        this.forEachServer((server: Server) => (total += server.players.length));

        return total;
    }

    /**
     * Iterates through all the servers and serializes them into an array.
     * @returns Contains an array of serialized server information.
     */

    public serialize(): SerializedServer[] {
        return Object.values(this.servers)
            .map((server: Server) => server.serialize())
            .sort((a, b) => {
                return a.id - b.id;
            });
    }

    /**
     * Iterates through all the server objects.
     * @param callback Contains the server object that we are iterating through currently.
     */

    public forEachServer(callback: (server: Server) => void): void {
        for (let server in this.servers) callback(this.servers[server]);
    }

    /**
     * Callback handler for when a new server is added.
     * @param callback Contains the name and id of the server added.
     */

    public onAdd(callback: ServerCallback): void {
        this.addCallback = callback;
    }

    /**
     * Callback handler for when a server is removed from our list.
     * @param callback Contains the name and id of the server removed.
     */

    public onRemove(callback: ServerCallback): void {
        this.removeCallback = callback;
    }

    /**
     * Callback for when we want to update the population of the servers.
     */

    public onUpdate(callback: () => void): void {
        this.updateCallback = callback;
    }
}
