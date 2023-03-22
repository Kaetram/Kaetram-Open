import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Utils from '@kaetram/common/util/utils';
import { Packets, Opcodes } from '@kaetram/common/network';

import type { GuildPacket } from '@kaetram/common/types/messages/outgoing';
import type Server from '../model/server';
import type {
    ChatPacket,
    FriendsPacket,
    HandshakePacket,
    PlayerPacket
} from '@kaetram/common/types/messages/hub';

export default class Incoming {
    public constructor(private server: Server) {
        // Callback for when the hub receives a message from the web socket.
        this.server.connection.onMessage(([packet, opcode, info]) => {
            if (!Utils.validPacket(packet)) {
                log.error(`Non-existent packet received: ${packet} data: `);
                log.error(info);

                return;
            }

            try {
                switch (packet) {
                    case Packets.Handshake: {
                        return this.handleHandshake(opcode);
                    }

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
                        return this.server.relay(opcode);
                    }
                }
            } catch (error) {
                log.error(error);
            }
        });
    }

    /**
     * Handles a handshake from the web socket. Here we assign a server ID
     * from the server list to the socket.
     * @param message Contains the server ID among other preliminary information.
     */

    private handleHandshake(data: HandshakePacket): void {
        // In the event the versions mismatch we just stop the connection.
        if (config.gver !== data.gVer) {
            log.error(`Game version mismatch: ${config.gver} ${data.gVer} from ${data.serverId}`);

            return this.server.connection.close();
        }

        this.server.load(data);

        this.server.readyCallback?.();
    }

    /**
     * Receives information about the player's login our logout activity.
     * @param opcode What type of player event we are handling.
     * @param info Contains the username of the player that is logging in or out.
     */

    private handlePlayer(opcode: Opcodes.Player, info: PlayerPacket): void {
        switch (opcode) {
            case Opcodes.Player.Login: {
                return this.server.add(info.username!, info.guild!);
            }

            case Opcodes.Player.Logout: {
                return this.server.remove(info.username!, info.guild!);
            }
        }
    }

    /**
     * Sends a chat callback message to the server. Depending on the information received,
     * we determine whether it's a private message or a normal message.
     * @param info Contains information about the message, such as source, content, and optionally, a target.
     */

    private handleChat(info: ChatPacket): void {
        return this.server.message(info.source, info.message!, info.target!);
    }

    /**
     * Handles incoming messages regarding a guild. Used to broadcast to other servers
     * actions that are performed on a guild. Things like a player joining, a player's
     * rank being changed, or someone leaving.
     * @param opcode The type of action that is being performed.
     * @param info unknown (for now).
     */

    public handleGuild(opcode: Opcodes.Guild, info: GuildPacket): void {
        switch (opcode) {
            case Opcodes.Guild.Update: {
                return this.server.handleGuild(info.username!, info.usernames!);
            }
        }
    }

    /**
     * Contains a list of inactive friends list for a given username. We relay this to the server
     * controller so that we can check if any server has a player that is on the inactive list.
     * @param info Contains the username and the list of inactive friends.
     */

    private handleFriends(info: FriendsPacket): void {
        return this.server.handleFriends(info.username, info.inactiveFriends!);
    }
}
