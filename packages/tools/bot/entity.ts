import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import config from '@kaetram/common/config';
import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import type Bot from './bot';
import type { PlayerData } from '@kaetram/common/network/impl/player';
import type {
    HandshakePacketData,
    TeleportPacketData
} from '@kaetram/common/types/messages/outgoing';
import type { connection as Connection, Message } from 'websocket';

export default class Entity {
    public instance = '';
    public serverId = -1;
    public x = -1;
    public y = -1;

    // Used when we want to connect without a database.
    public username = `Bot${Utils.counter++}${Utils.randomInt(0, 1000)}`;

    private readyCallback?: () => void;

    public constructor(
        public bot: Bot,
        public connection: Connection
    ) {
        this.connection.on('message', this.handleMessage.bind(this));
    }

    /**
     * Parses a message received from the server and handles it accordingly.
     * @param message Contains UTF8 packet data from the server.
     */

    private handleMessage(message: Message): void {
        if (message.type !== 'utf8') return;

        let info = message.utf8Data;

        // We received a raw UTF8 message from the hub, we don't really handle these.
        if (!info.startsWith('[')) return;

        let data = JSON.parse(info);

        if (data.length > 1) for (let info of data) this.handlePacket(info);
        else this.handlePacket(data[0]);
    }

    /**
     * Handles an incoming packet from the server and initializes the appropriate data.
     * @param param0 Contains the packet id, the opcode (which sometimes may be the data),
     * and the data (third parameter specified if opcode is also specified).
     */

    private handlePacket([packet, opcode, data]: [number, unknown, unknown]): void {
        switch (packet) {
            case Packets.Handshake: {
                return this.handleHandshake(opcode as HandshakePacketData);
            }

            case Packets.Welcome: {
                return this.handleWelcome(opcode as PlayerData);
            }

            case Packets.Teleport: {
                return this.handleTeleport(opcode as TeleportPacketData);
            }
        }
    }

    /**
     * Handles the incoming handshake and sends a request to the server to log
     * in with a specified set of credentials. We then await the ready packet.
     */

    private handleHandshake(info: HandshakePacketData): void {
        if (info.type !== 'client') {
            log.error(`Handshake failed: ${info.type} is not a client.`);

            return;
        }

        this.instance = info.instance!;
        this.serverId = info.serverId!;

        // If we are skipping database then we can log in with any credentials.
        if (config.skipDatabase)
            this.send(Packets.Login, {
                username: this.username,
                password: 'chocolate',
                opcode: Opcodes.Login.Login
            });
        else this.send(Packets.Login, { opcode: Opcodes.Login.Guest });
    }

    /**
     * Welcome packet handles a successful login. We receive the necessary player
     * data from the server and must relay a ready packet to the server.
     * @param data Contains information about the player.
     */

    private handleWelcome(data: PlayerData): void {
        this.x = data.x;
        this.y = data.y;
        this.username = data.name;

        // The entity has been successfully initialized and we send a ready packet.
        this.send(Packets.Ready, { regionsLoaded: 0, userAgent: 'bot' });

        // Signal to the bot controller that the entity is ready.
        if (this.readyCallback) this.readyCallback();

        log.info(`Successfully logged in as ${this.username} at ${this.x}, ${this.y}.`);

        // Begin the roaming interval and sending chats.
        setInterval(
            () => {
                let chat = Utils.randomInt(1, 16) === 4;

                // If we are sending a chat, we generate a random string to send.
                if (chat) this.chat('Hello this is a chat message from a bot!');
                else this.move(this.x + Utils.randomInt(-1, 1), this.y + Utils.randomInt(-1, 1));
            },
            Utils.randomInt(4000, 15_000)
        );
    }

    /**
     * Updates the position of the entity when we receive a teleport packet.
     * @param info Contains information about the teleport.
     */

    private handleTeleport(info: TeleportPacketData): void {
        this.x = info.x;
        this.y = info.y;
    }

    /**
     * Sends a chat message to the server.
     * @param message String contents of the message.
     */

    private chat(message: string): void {
        this.send(Packets.Chat, [message]);
    }

    /**
     * Mimics a set of movement packets to send to the server and
     * have the player move without triggering the anti-cheat.
     * @param x The x grid coordinate to move to.
     * @param y The y grid coordinate to move to.
     */

    private move(x: number, y: number): void {
        // Skip movements that result in collisions.
        if (this.bot.isCollision(x, y)) return;

        // Skip movements that are the same as the current position.
        if (this.x === x && this.y === y) return;

        // Send the request packet to the server.
        this.send(Packets.Movement, {
            opcode: Opcodes.Movement.Request,
            requestX: x,
            requestY: y,
            playerX: this.x,
            playerY: this.y,
            targetInstance: undefined,
            following: false
        });

        // send the start packet to the server.
        this.send(Packets.Movement, {
            opcode: Opcodes.Movement.Started,
            requestX: x,
            requestY: y,
            playerX: this.x,
            playerY: this.y,
            movementSpeed: 250,
            targetInstance: undefined
        });

        // Send a step packet to the server 250 milliseconds later and stop the movement.
        setTimeout(() => {
            // Update the player's position.
            this.x = x;
            this.y = y;

            // Send the step packet to the server.
            this.send(Packets.Movement, {
                opcode: Opcodes.Movement.Step,
                playerX: x,
                playerY: y,
                timestamp: Date.now()
            });
        }, 250);

        // Send the stop packet to the server 750 milliseconds later.
        setTimeout(() => {
            // Send the stop packet to the server.
            this.send(Packets.Movement, {
                opcode: Opcodes.Movement.Stop,
                playerX: x,
                playerY: y,
                targetInstance: undefined,
                orientation: Modules.Orientation.Down
            });
        }, 750);
    }

    /**
     * Converts the packet information into a JSON string and sends it to the server.
     * @param packet The packet id of the packet to send.
     * @param data The additional data to send with the packet.
     */

    private send(packet: Packets, data?: unknown): void {
        this.connection.send(JSON.stringify([packet, data]));
    }

    /**
     * Callback for when the player is ready.
     */

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }
}
