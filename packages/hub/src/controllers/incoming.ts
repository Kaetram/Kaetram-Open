import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Utils from '@kaetram/common/util/utils';
import { Packets, Opcodes } from '@kaetram/common/network';

import type Server from '../model/server';
import type { HandshakePacket } from '@kaetram/common/types/messages/incoming';
import type { PlayerPacket } from '@kaetram/common/types/messages/outgoing';

export default class Incoming {
    public constructor(private server: Server) {
        // Callback for when the hub receives a message from the web socket.
        this.server.connection.onMessage(([packet, message, info]) => {
            if (!Utils.validPacket(packet)) {
                log.error(`Non-existent packet received: ${packet} data: `);
                log.error(message);

                return;
            }

            try {
                switch (packet) {
                    case Packets.Handshake: {
                        return this.handleHandshake(message);
                    }

                    case Packets.Player: {
                        return this.handlePlayer(message, info);
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
     * Contains events regarding a player. Things like logging in, logging out,
     * chat packets (private messages). We use this information to broadcast
     * to the other servers.
     * @param opcode What type of player event we are handling.
     * @param info Contains information about the event.
     */

    private handlePlayer(opcode: Opcodes.Player, info: PlayerPacket): void {
        switch (opcode) {
            case Opcodes.Player.Login: {
                return this.server.add(info.username!);
            }

            case Opcodes.Player.Logout: {
                return this.server.remove(info.username!);
            }

            case Opcodes.Player.Chat: {
                if (!info.chat) return;

                return this.server.messageCallback?.(
                    info.chat.source!,
                    info.chat.message,
                    info.chat.target!
                );
            }

            case Opcodes.Player.Friends: {
                if (!info.inactiveFriends) return;

                return this.server.friendsCallback?.(info.username!, info.inactiveFriends);
            }
        }
    }
}
