import Model from '.';

import Packet from '@kaetram/common/network/packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import { GuildPacket, FriendsPacket, ChatPacket } from '@kaetram/common/network/impl';

import type { PlayerPacketData } from '@kaetram/common/network/impl/player';
import type { HandshakePacketData } from '@kaetram/common/network/impl/handshake';
import type { Member } from '@kaetram/common/network/impl/guild';
import type { Friend } from '@kaetram/common/network/impl/friends';
import type { ChatPacketData, FriendsPacketData } from '@kaetram/common/types/messages/hub';
import type { SerializedServer } from '@kaetram/common/types/network';
import type { GuildPacketData } from '@kaetram/common/types/messages/outgoing';

export default class Server extends Model {
    public id = -1;
    public name = '';
    public host = '';
    public port = -1;

    public players: string[] = [];

    public maxPlayers = 2;

    /**
     * Loads the information from the handshake packet into the server object.
     * @param data Contains preliminary information about the server.
     */

    public load(data: HandshakePacketData): void {
        if (data.type === 'hub') {
            this.name = data.name;
            this.id = data.serverId;
            this.host = data.remoteHost;
            this.port = data.port;
            this.players = data.players;
            this.maxPlayers = data.maxPlayers;
        } else log.error(`Invalid handshake type: ${data.type}`);
    }

    public override handlePacket(packet: Packets, opcode: never, info: never): void {
        switch (packet) {
            case Packets.Chat: {
                return this.handleChat(opcode);
            }

            case Packets.Guild: {
                return this.handleGuild(opcode, info);
            }

            case Packets.Friends: {
                return this.handleFriends(info);
            }

            case Packets.Player: {
                return this.handlePlayer(opcode, info);
            }

            case Packets.Relay: {
                return this.relay(opcode);
            }
        }
    }

    /**
     * Receives information about the player's login our logout activity.
     * @param opcode What type of player event we are handling.
     * @param info Contains the username of the player that is logging in or out.
     */

    private handlePlayer(opcode: Opcodes.Player, info: PlayerPacketData): void {
        switch (opcode) {
            case Opcodes.Player.Login: {
                return this.add(info.username!, info.guild!);
            }

            case Opcodes.Player.Logout: {
                return this.remove(info.username!, info.guild!);
            }
        }
    }

    /**
     * Sends a chat callback message to the server. Depending on the information received,
     * we determine whether it's a private message or a normal message.
     * @param info Contains information about the message, such as source, content, and optionally, a target.
     */

    private handleChat(info: ChatPacketData): void {
        return this.message(info.source, info.message!, info.target!);
    }

    /**
     * Handles incoming messages regarding a guild. Used to broadcast to other servers
     * actions that are performed on a guild. Things like a player joining, a player's
     * rank being changed, or someone leaving.
     * @param opcode The type of action that is being performed.
     * @param info unknown (for now).
     */

    public handleGuild(opcode: Opcodes.Guild, info: GuildPacketData): void {
        switch (opcode) {
            case Opcodes.Guild.Update: {
                let { username, usernames: inactiveMembers } = info,
                    activeMembers: Member[] = [];

                for (let member of inactiveMembers!) {
                    let targetServer = this.controller.findPlayer(member);

                    if (targetServer)
                        activeMembers.push({ username: member, serverId: targetServer.id });
                }

                // Send the list of active members back to the source server's player.
                this.send(
                    new GuildPacket(Opcodes.Guild.Update, { username, members: activeMembers })
                );
            }
        }
    }

    /**
     * Contains a list of inactive friends list for a given username. We relay this to the server
     * controller so that we can check if any server has a player that is on the inactive list.
     * @param info Contains the username and the list of inactive friends.
     */

    private handleFriends(info: FriendsPacketData): void {
        let { username, inactiveFriends } = info,
            activeFriends: Friend = {};

        // Look through all the inactive friends and try to find them on a server.
        for (let friend of inactiveFriends!) {
            let targetServer = this.controller.findPlayer(friend);

            // If the player is online, add them to the active friends list.
            if (targetServer) activeFriends[friend] = { online: true, serverId: targetServer.id };
        }

        // Send the active friends back to the server.
        this.send(new FriendsPacket(Opcodes.Friends.Sync, { username, activeFriends }));
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
        this.controller.broadcastServers(packet, this.instance);
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
        this.controller.broadcastServers(
            new Packet(Packets.Player, Opcodes.Player.Login, {
                username,
                serverId: this.id,
                guild
            })
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
        this.controller.broadcastServers(
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
        if (!targetServer) return this.send(new ChatPacket({ source, target, notFound: true }));

        // Send the private message to the target player's server.
        targetServer.send(new ChatPacket({ source, message, target }));

        // Send a confirmation to the source server that the message was sent.
        this.send(new ChatPacket({ source, message, target, success: true }));
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
