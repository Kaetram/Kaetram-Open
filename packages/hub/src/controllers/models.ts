import Server from '../model/server';
import Admin from '../model/admin';

import log from '@kaetram/common/util/log';
import { ChatPacket } from '@kaetram/common/network/impl';
import Utils from '@kaetram/common/util/utils';
import { Packets } from '@kaetram/common/network';
import config from '@kaetram/common/config';
import Packet from '@kaetram/common/network/packet';

import type Model from '../model';
import type Connection from '../network/connection';
import type { SerializedServer } from '@kaetram/common/types/network';
import type { HandshakePacketData } from '@kaetram/common/network/impl/handshake';

type PlayerCallback = (
    username: string,
    serverId: number,
    logout: boolean,
    population: number
) => void;
type ServerCallback = (id: number, name: string) => void;
type MessageCallback = (
    source: string,
    message: string,
    serverName?: string,
    withArrow?: boolean
) => void;

export default class Models {
    private models: { [instance: string]: Model } = {};

    public playerCallback?: PlayerCallback;
    public messageCallback?: MessageCallback;

    private addCallback?: ServerCallback;
    private removeCallback?: ServerCallback;

    /**
     * Handles the creation of a new server object upon initial connection. This creates
     * the object and adds it to our list of servers after the handshake has completed.
     * @param instance The instance of the server we are connecting to.
     * @param connection The websocket connection to the server.
     */

    public connect(instance: string, connection: Connection): void {
        connection.onMessage(([packet, opcode, info]) => {
            if (!Utils.validPacket(packet)) {
                log.error(`Non-existent packet received: ${packet} data: `);
                log.error(info);

                return;
            }

            if (packet === Packets.Handshake) this.handleHandshake(opcode, instance, connection);
            else this.models[instance].handlePacket(packet, opcode, info);

            this.syncAdmins();
        });
    }

    private handleHandshake(data: HandshakePacketData, instance: string, connection: Connection) {
        switch (data.type) {
            case 'hub': {
                if (config.gver !== data.gVer) {
                    log.error(
                        `Game version mismatch: ${config.gver} ${data.gVer} from ${data.serverId}`
                    );

                    return connection.close();
                }

                let server = new Server(this, instance, connection);

                server.load(data);
                this.addServer(server);

                break;
            }

            case 'admin': {
                let admin = new Admin(this, instance, connection);

                this.addAdmin(admin);

                break;
            }

            case 'client': {
                log.error(`Client ${instance} is not a valid server.`);

                break;
            }
        }
    }

    /**
     * Get a server object from our list of servers.
     * @param instance The instance of the server we are getting.
     * @returns The server object if it exists.
     */

    private getServer(instance: string): Server | undefined {
        let server = this.models[instance];

        if (server instanceof Server) return server;
    }

    /**
     * Get a list of all servers.
     * @returns An array of all servers.
     */

    private getAllServers(): Server[] {
        let servers = Object.values(this.models).filter((model) => model instanceof Server);

        return servers as Server[];
    }

    /**
     * Get an admin object from our list of admins.
     * @param instance The instance of the admin we are getting.
     * @returns The admin object if it exists.
     */

    private getAdmin(instance: string): Admin | undefined {
        let admin = this.models[instance];

        if (admin instanceof Admin) return admin;
    }

    /**
     * Get a list of all admins.
     * @returns An array of all admins.
     */

    private getAllAdmins(): Admin[] {
        let admins = Object.values(this.models).filter((model) => model instanceof Admin);

        return admins as Admin[];
    }

    /**
     * Handles adding a server to our list of servers.
     * @param server The server object we are adding.
     */

    private addServer(server: Server): void {
        if (server.instance in this.models)
            return log.error(`Server ${server.instance} already exists.`);

        this.models[server.instance] = server;
        this.addCallback?.(server.id, server.name);
    }

    /**
     * Handles adding an admin to our list of admins.
     * @param admin The admin object we are adding.
     */

    private addAdmin(admin: Admin): void {
        if (admin.instance in this.models)
            return log.error(`Admin ${admin.instance} already exists.`);

        this.models[admin.instance] = admin;
    }

    private syncAdmins() {
        this.broadcastAdmins(
            new Packet(Packets.AdminSync, undefined, { servers: this.serializeServers() })
        );
    }

    /**
     * Handles removing a server from our list of servers.
     * @param instance The instance of the server we are removing.
     */

    public remove(instance: string): void {
        if (!(instance in this.models)) return;

        let model = this.models[instance];

        // Prevent crashes from removing non-existent servers.
        if (model instanceof Server) this.removeCallback?.(model.id, model.name);

        delete this.models[instance];

        this.syncAdmins();
    }

    /**
     * Broadcasts a message to all servers. Optionally we can exclude a server.
     * @param packet The packet object that we want to send to the server.
     * @param exclude The server we are excluding from the broadcast.
     */

    public broadcastServers(packet: Packet, exclude = ''): void {
        for (let instance in this.models) {
            if (instance === exclude) continue;

            this.getServer(instance)?.send(packet);
        }
    }

    /**
     * Broadcasts a message to all admins. Optionally we can exclude an admin.
     * @param packet The packet object that we want to send to the admin.
     * @param exclude The admin we are excluding from the broadcast.
     */

    public broadcastAdmins(packet: Packet, exclude = ''): void {
        for (let instance in this.models) {
            if (instance === exclude) continue;

            this.getAdmin(instance)?.send(packet);
        }
    }

    /**
     * Relays a global chat message to all the servers connected to the hub.
     * @param source Who is sending the message (generally someone on Discord).
     * @param message The string contents of the message.
     * @param colour Colour of the text we are sending.
     */

    public global(source: string, message: string, colour: string): void {
        this.broadcastServers(new ChatPacket({ source, message, colour }));
    }

    /**
     * Handles a player logging in or out of the game. We use this
     * to update the Discord server with the amount of players online and
     * with the logout/login activity.
     * @param username The username of the player.
     * @param serverId The id of the server the player is on.
     * @param logout The type of action we are performing (defaults to false)
     */

    public handlePlayer(username: string, serverId: number, logout = false): void {
        let total = this.getTotalPlayers();

        this.playerCallback?.(username, serverId, logout, total);
    }

    /**
     * Checks that there is at least one server with space for a new player.
     * @returns Whether or not some of the servers have more player spaces than amount of players.
     */

    public hasSpace(): boolean {
        return Object.values(this.models).some((server) => {
            return server instanceof Server && server.players.length < server.maxPlayers;
        });
    }

    /**
     * Iterates through all the servers and finds the first one that has
     * space for the new player. If we cannot find a server then we
     * return undefined.
     * @returns The server that has space for a new player, or undefined if not found.
     */

    public findEmptyServer(): Server | undefined {
        for (let server of this.getAllServers()) {
            if (server.players.length >= server.maxPlayers - 1) continue;

            return server;
        }

        return undefined;
    }

    /**
     * Searches through all the servers and finds whether or not
     * the server contains the `username` specified.
     * @param username The username we are looking for.
     * @returns The server containing the user.
     */

    public findPlayer(username: string): Server | undefined {
        for (let server of this.getAllServers())
            if (server.players.includes(username)) return server;

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

    public serializeServers(): SerializedServer[] {
        return this.getAllServers()
            .map((server) => server.serialize())
            .sort((a, b) => a.id - b.id);
    }

    /**
     * Iterates through all the server objects.
     * @param callback Contains the server object that we are iterating through currently.
     */

    public forEachServer(callback: (server: Server) => void): void {
        for (let server of this.getAllServers()) callback(server);
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
     * Callback for when a player logs in or out of the server. Used for updating
     * the Discord bot with the current population.
     * @param callback Contains the username of the player, whether they are
     * logging in or out, and the total population across all servers.
     */

    public onPlayer(callback: PlayerCallback): void {
        this.playerCallback = callback;
    }

    /**
     * Message for when anyone on any server sends a message. We send
     * these messages to the Discord bot.
     * @param callback Contains who sent the message and what was sent.
     */

    public onMessage(callback: MessageCallback): void {
        this.messageCallback = callback;
    }
}
