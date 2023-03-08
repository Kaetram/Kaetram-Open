import Packet from '../network/packet';
import Incoming from '../controllers/incoming';

import Utils from '@kaetram/common/util/utils';
import { Opcodes, Packets } from '@kaetram/common/network';

import type Connection from '../network/connection';
import type { SerializedServer } from '@kaetram/common/types/network';
import type { HandshakePacket } from '@kaetram/common/types/messages/incoming';

type BroadcastCallback = (packet: Packet) => void;
type MessageCallback = (source: string, message: string, target: string) => void;
export default class Server {
    public id = -1;
    public name = '';
    public host = '';
    public port = -1;
    public address = '';

    public players: string[] = [];

    public maxPlayers = 2;

    public readyCallback?: () => void;
    public broadcastCallback?: BroadcastCallback;
    public messageCallback?: MessageCallback;

    public constructor(public instance: string, public connection: Connection) {
        this.address = Utils.bufferToAddress(this.connection.socket.getRemoteAddressAsText());

        new Incoming(this);
    }

    /**
     * Loads the information from the handshake packet into the server object.
     * @param data Contains preliminary information about the server.
     */

    public load(data: HandshakePacket): void {
        this.name = data.name!;
        this.id = data.serverId!;
        this.host = data.remoteHost!;
        this.port = data.port!;
        this.players = data.players!;
        this.maxPlayers = data.maxPlayers!;
    }

    /**
     * Handles sending a message to the server's websocket connection.
     * @param packet The packet object that we want to send to the server.
     */

    public send(packet: Packet): void {
        this.connection.send(JSON.stringify(packet.serialize()));
    }

    /**
     * Adds a player to the server's player list.
     * @param username The username of the player that we are adding.
     */

    public add(username: string): void {
        // Ensure the player is not already in the list.
        if (this.players.includes(username)) return;

        this.players.push(username);

        this.broadcastCallback?.(
            new Packet(Packets.Player, Opcodes.Player.Login, { username, serverId: this.id })
        );
    }

    /**
     * Handles removing a player from the server's player list.
     * @param username The username of the player that we are removing.
     */

    public remove(username: string): void {
        this.players = this.players.filter((player) => player !== username);

        this.broadcastCallback?.(
            new Packet(Packets.Player, Opcodes.Player.Logout, { username, serverId: this.id })
        );
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
     * Callback for when we want to broadcast a message to all servers.
     * @param callback Contains the packet that we want to broadcast.
     */

    public onBroadcast(callback: BroadcastCallback): void {
        this.broadcastCallback = callback;
    }

    /**
     * Callback for when we want to send a private message.
     * @param callback Contains the source, message, and target of the message.
     */

    public onMessage(callback: MessageCallback): void {
        this.messageCallback = callback;
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
