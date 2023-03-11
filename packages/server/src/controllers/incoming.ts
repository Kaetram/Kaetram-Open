import Utils from '@kaetram/common/util/utils';
import { Packets, Opcodes } from '@kaetram/common/network';

import type World from '../game/world';
import type { ChatPacket, FriendsPacket, PlayerPacket } from '@kaetram/common/types/messages/hub';

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

    public handle([packet, opcode, data]: [number, number, unknown]): void {
        switch (packet) {
            case Packets.Player: {
                return this.handlePlayer(opcode, data as PlayerPacket);
            }

            case Packets.Chat: {
                return this.handleChat(data as ChatPacket);
            }

            case Packets.Friends: {
                return this.handleFriends(data as FriendsPacket);
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

    private handlePlayer(opcode: Opcodes.Player, data: PlayerPacket): void {
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

    private handleChat(data: ChatPacket) {
        // Not found occurs when the hub could not find the player anywhere.
        if (data.notFound) {
            let player = this.world.getPlayerByName(data.source!);

            return player?.notify(`Player @aquamarine@${data.target}@white@ is not online.`);
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
     * Receives information from the server regarding a player's active friends. When a player first
     * logs in, we check the server they're currently on for who is online. We then ask the hub to check
     * remaining non-active friends on other servers. Here we receive the information from the hub and
     * update the player's friends list.
     * @param data Contains the player's username and their active friends (alongside their serverId).
     */

    private handleFriends(data: FriendsPacket): void {
        let player = this.world.getPlayerByName(data.username!);

        if (data.activeFriends) player?.friends.setActiveFriends(data.activeFriends);
    }
}
