import Incoming from '../controllers/incoming';

import Utils from '@kaetram/common/util/utils';
import Packet from '@kaetram/common/network/packet';
import { Chat, Friends, Guild, Relay } from '@kaetram/common/network/impl';
import { Opcodes, Packets } from '@kaetram/common/network';

import type { Member } from '@kaetram/common/types/guild';
import type { Friend } from '@kaetram/common/types/friends';
import type Servers from '../controllers/servers';
import type Connection from '../network/connection';
import type { SerializedServer } from '@kaetram/common/types/network';
import type { HandshakePacket } from '@kaetram/common/types/messages/hub';

export default class Server {
    public id = -1;
    public name = '';
    public host = '';
    public port = -1;
    public address = '';

    public players: string[] = [];

    public maxPlayers = 2;

    public readyCallback?: () => void;

    public constructor(
        public instance: string,
        public controller: Servers,
        public connection: Connection
    ) {
        this.address = Utils.bufferToAddress(this.connection.socket.getRemoteAddressAsText());

        new Incoming(this);
    }

    /**
     * Loads the information from the handshake packet into the server object.
     * @param data Contains preliminary information about the server.
     */

    public load(data: HandshakePacket): void {
        this.name = data.name;
        this.id = data.serverId;
        this.host = data.remoteHost;
        this.port = data.port;
        this.players = data.players;
        this.maxPlayers = data.maxPlayers;
    }

    /**
     * Handles sending a message to the server's websocket connection.
     * @param packet The packet object that we want to send to the server.
     */

    public send(packet: Packet): void {
        this.connection.send(JSON.stringify(packet.serialize()));
    }

    /**
     * A broadcast message is sent to all the servers currently connected to the hub.
     * We also want to relay an update to the Discord bot to update population
     * if it's a login/logout-based packet.
     * @param packet The packet that we want to broadcast to all servers.
     */

    public broadcast(packet: Packet): void {
        this.controller.broadcast(packet, this.instance);
    }

    /**
     * Relay is a packet that is sent across servers to another player. This is generally
     * used by things like guilds when we want to synchronize the joining and leaving of
     * a player across all servers.
     * @param info Contains the username of the player as first element, and unknown
     * packet data as the second element.
     */

    public relay(info: [string, [number, unknown, unknown]]): void {
        let server = this.controller.findPlayer(info[0]);

        if (!server) return;

        // Create a new packet with the relay data and send it to the target server.
        server.send(new Packet(Packets.Relay, undefined, info));
    }

    /**
     * Adds a player to the server's player list.
     * @param username The username of the player that we are adding.
     */

    public add(username: string, guild = ''): void {
        // Ensure the player is not already in the list.
        if (this.players.includes(username)) return;

        // Add the player to the list.
        this.players.push(username);

        // Broadcast the login to all the servers.
        this.controller.broadcast(
            new Packet(Packets.Player, Opcodes.Player.Login, { username, serverId: this.id, guild })
        );

        // Create a callback for the player logging in.
        this.controller.handlePlayer(username, this.id);
    }

    /**
     * Handles removing a player from the server's player list.
     * @param username The username of the player that we are removing.
     */

    public remove(username: string, guild = ''): void {
        // Filter out the player from the list.
        this.players = this.players.filter((player) => player !== username);

        // Broadcast the logout to all the servers.
        this.controller.broadcast(
            new Packet(Packets.Player, Opcodes.Player.Logout, {
                username,
                serverId: this.id,
                guild
            })
        );

        // Create a callback for the player logging out.
        this.controller.handlePlayer(username, this.id, true);
    }

    /**
     * Handles sending a chat message between servers. THis can refer to a private message or
     * redirecting an in-game chat to the Discord bot for logging.
     * @param source The username of who is sending the message.
     * @param message The contents of the message (filtered by the server).
     * @param target (Optional) Who the message is directed towards, determines if it's a private message.
     */

    public message(source: string, message: string, target?: string): void {
        // If we don't have a target then we just send the message to the Discord bot.
        if (!target)
            return this.controller.messageCallback?.(source, message, `${this.name} ${this.id}`);

        // Attempt to find the target player on the server.
        let targetServer = this.controller.findPlayer(target);

        // No player could be found, so we tell the source server that the player is not online.
        if (!targetServer) return this.send(new Chat({ source, target, notFound: true }));

        // Send the private message to the target player's server.
        targetServer.send(new Chat({ source, message, target }));

        // Send a confirmation to the source server that the message was sent.
        this.send(new Chat({ source, message, target, success: true }));
    }

    /**
     * Searches through all the game servers to see which players in the `inactiveMembers`
     * list are online on another server. We create a dictionary of these players and
     * pass it back to the player that is making the request.
     * @param username The player that is making the request.
     * @param inactiveMembers List of members to search for in other servers.
     */

    public handleGuild(username: string, inactiveMembers: string[] = []): void {
        let activeMembers: Member[] = [];

        for (let member of inactiveMembers) {
            let targetServer = this.controller.findPlayer(member);

            if (targetServer) activeMembers.push({ username: member, serverId: targetServer.id });
        }

        // Send the list of active members back to the source server's player.
        this.send(new Guild(Opcodes.Guild.Update, { username, members: activeMembers }));
    }

    /**
     * Searches through all the servers connected to the hub and tries to see which players
     * among the inactive player list are online. For each player online we store them in
     * an array. We send that array back to the source server (where the player logged in),
     * and the source server will update the player's friend list.
     * @param username The player that is logging in.
     * @param inactiveFriends The list of friends that are not online on the source server.
     */

    public handleFriends(username: string, inactiveFriends: string[] = []): void {
        let activeFriends: Friend = {};

        // Look through all the inactive friends and try to find them on a server.
        for (let friend of inactiveFriends) {
            let targetServer = this.controller.findPlayer(friend);

            // If the player is online, add them to the active friends list.
            if (targetServer) activeFriends[friend] = { online: true, serverId: targetServer.id };
        }

        // Send the active friends back to the server.
        this.send(new Friends(Opcodes.Friends.Sync, { username, activeFriends }));
    }

    /**
     * Ready callback for when the server has finished initializing the handshake
     * protocol with the hub. Once the handshake is ready and we have all the preliminary
     * data, we can add the server to the list of servers.
     */

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }

    /**
     * Condenses the crucial server information into a JSON object.
     * @returns A SerializedServer object.
     */

    public serialize(): SerializedServer {
        return {
            id: this.id,
            name: this.name,
            host: this.host,
            port: this.port,
            players: this.players.length,
            maxPlayers: this.maxPlayers
        };
    }
}
