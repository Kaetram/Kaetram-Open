import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Packets, Opcodes } from '@kaetram/common/network';
import { GuildPacket } from '@kaetram/common/network/impl';
import Packet from '@kaetram/common/network/packet';

import type World from '../game/world';
import type { GuildPacketData, PlayerPacketData } from '@kaetram/common/types/messages/outgoing';
import type {
    ChatPacketData,
    FriendsPacketData,
    RelayPacketData
} from '@kaetram/common/types/messages/hub';

/**
 * This incoming is the global incoming controller. This is responsible for
 * communication between the server and the client. If you are an active developer
 * of Kaetram you'll find yourself confused as to why there are two incoming
 * controllers. The player-based one was relocated in the player directory.
 * Coming up with names for network handlers is hard and more confusing than it's worth.
 */

export default class Incoming {
    public constructor(private world: World) {}

    /**
     * Entrypoint for handling incoming packets from the hub. We organize them in an
     * array. First element is the packet type, the second is the opcode, and lastly
     * we have whatever data the hub decided to send.
     */

    public handle([packet, opcode, data]: [number, unknown, unknown]): void {
        switch (packet) {
            case Packets.Player: {
                return this.handlePlayer(opcode as number, data as PlayerPacketData);
            }

            case Packets.Chat: {
                return this.handleChat(opcode as ChatPacketData);
            }

            case Packets.Guild: {
                return this.handleGuild(opcode as number, data as GuildPacketData);
            }

            case Packets.Friends: {
                return this.handleFriends(data as FriendsPacketData);
            }

            case Packets.Relay: {
                return this.handleRelay(opcode as RelayPacketData);
            }
        }
    }

    /**
     * Responsible for synchronizing the player's login or logout actions with the controllers
     * in the server. This updates the friends list/guilds/etc of other players and notifies
     * them that the player has logged in or out (if applicable).
     * @param opcode What type of action the player is performing (logging in or out)
     * @param data Contains the player's username and server id.
     */

    private handlePlayer(opcode: Opcodes.Player, data: PlayerPacketData): void {
        // Synchronize the player's login or logout to the guild members.
        if (data.guild)
            this.world.syncGuildMembers(
                data.guild,
                data.username,
                opcode === Opcodes.Player.Logout,
                data.serverId
            );

        // Synchronize the player's login or logout to the friends list.
        return this.world.syncFriendsList(
            data.username,
            opcode === Opcodes.Player.Logout,
            data.serverId
        );
    }

    /**
     * Handles the event received from the hub about chat messages. This can be used
     * for private messages or global messages (from the Discord bot).
     * @param chat Contains information about the message.
     */

    private handleChat(data: ChatPacketData) {
        // Not found occurs when the hub could not find the player anywhere.
        if (data.notFound) {
            let player = this.world.getPlayerByName(data.source!);

            return player?.notify(`misc:NOT_ONLINE;username=${data.target}`);
        }

        // Success is an event sent from the hub when the message was successfully delivered.
        if (data.success) {
            let player = this.world.getPlayerByName(data.source!);

            return player?.notify(
                data.message!,
                'aquamarine',
                `[To ${Utils.formatName(data.target!)}]`,
                true
            );
        }

        // No target means that the message is globally sent.
        if (!data.target)
            return this.world.globalMessage(
                data.source!,
                data.message!,
                data.colour || 'tomato',
                true
            );

        // Find who the message is targeted towards and attempt to send them a message.
        let target = this.world.getPlayerByName(data.target!);

        target?.sendMessage(data.target!, data.message!, data.source!);
    }

    /**
     * Receives information from the hub regarding a guild. Generally this is used when a
     * player logs in and requests to verify the online status of their guild's members.
     * We receive a packet here and relay the list of members to the player's client.
     * @param opcode The type of action that the hub is performing (update usually).
     * @param data Contains information about the opcode.
     */

    private handleGuild(opcode: Opcodes.Guild, data: GuildPacketData): void {
        switch (opcode) {
            case Opcodes.Guild.Update: {
                if (!data.username || !data.members) return;

                let player = this.world.getPlayerByName(data.username);

                // Send the packet to the player's client.
                if (player)
                    player.send(new GuildPacket(Opcodes.Guild.Update, { members: data.members }));

                return;
            }
        }
    }

    /**
     * Receives information from the server regarding a player's active friends. When a player first
     * logs in, we check the server they're currently on for who is online. We then ask the hub to check
     * remaining non-active friends on other servers. Here we receive the information from the hub and
     * update the player's friends list.
     * @param data Contains the player's username and their active friends (alongside their serverId).
     */

    private handleFriends(data: FriendsPacketData): void {
        let player = this.world.getPlayerByName(data.username!);

        if (data.activeFriends) player?.friends.setActiveFriends(data.activeFriends);
    }

    /**
     * Handles receiving a relay packet. This contains a username that we want to send the packet
     * to across servers. The first element in the RelayPacket array is the player's username,
     * and the second is the packet that we want to send to them.
     * @param data Contains the player's username and the packet we want to send to them.
     */

    private handleRelay(data: RelayPacketData): void {
        let [username, info] = data,
            player = this.world.getPlayerByName(username);

        // Could hypothetically happen if the player is in the process of logging out.
        if (!player) return log.debug(`Could not find player ${username} to relay packet.`);

        // Relays the packet to the player's packet handler.
        player.send(new Packet(info[0], info[1], info[2]));
    }
}
