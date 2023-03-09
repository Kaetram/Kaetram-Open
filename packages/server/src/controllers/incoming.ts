import Utils from '@kaetram/common/util/utils';
import { Packets, Opcodes } from '@kaetram/common/network';

import type World from '../game/world';
import type { PlayerPacket } from '@kaetram/common/types/messages/outgoing';

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
        }
    }

    /**
     * Handles an incoming packet from the hub regarding the player. Generally we use
     * this information to synchronize friends list across multiple servers.
     * @param opcode The opcode of the data we are handling.
     * @param data Information contained within the packet.
     */

    private handlePlayer(opcode: Opcodes.Player, data: PlayerPacket): void {
        switch (opcode) {
            // Synchronizes the friends list of a player.
            case Opcodes.Player.Login:
            case Opcodes.Player.Logout: {
                return this.world.syncFriendsList(
                    data.username!,
                    opcode === Opcodes.Player.Logout,
                    data.serverId!
                );
            }

            case Opcodes.Player.Chat: {
                if (!data.chat) return;

                // Not found occurs when the hub could not find the player anywhere.
                if (data.chat.notFound) {
                    let player = this.world.getPlayerByName(data.chat.source!);

                    return player?.notify(
                        `Player @aquamarine@${data.chat.target}@white@ is not online.`
                    );
                }

                // Success is an event sent from the hub when the message was successfully delivered.
                if (data.chat.success) {
                    let player = this.world.getPlayerByName(data.chat.source!);

                    return player?.notify(
                        data.chat.message,
                        'aquamarine',
                        `[To ${Utils.formatName(data.chat.target!)}]`,
                        true
                    );
                }

                let target = this.world.getPlayerByName(data.chat.target!);

                return target?.sendMessage(data.chat.target!, data.chat.message, data.chat.source!);
            }

            // Synchronizes the active friends the hub found in other servers.
            case Opcodes.Player.Friends: {
                if (!data.activeFriends) return;

                let player = this.world.getPlayerByName(data.username!);

                return player?.friends.setActiveFriends(data.activeFriends);
            }
        }
    }
}
